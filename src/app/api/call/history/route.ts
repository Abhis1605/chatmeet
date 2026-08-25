import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"

const PAGE_SIZE = 20

function getOutcome(call: {
    status: string
    participants: { userId: string; status: string }[]
}, userId: string) {
    const requester = call.participants.find((participant) => participant.userId === userId)

    if (requester?.status === 'REJECTED') return 'Declined'
    if (call.status === 'ACTIVE') return 'Active'
    if (call.status === 'MISSED' || requester?.status === 'INVITED') return 'Missed'
    return 'Completed'
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const cursor = searchParams.get('cursor')

        const cursorSession = cursor
            ? await prisma.callSession.findUnique({
                where: { id: cursor },
                select: { id: true, startedAt: true },
            })
            : null

        const calls = await prisma.callSession.findMany({
            where: {
                participants: {
                    some: {
                        userId: session.user.id,
                    },
                },
                ...(cursorSession
                    ? {
                        OR: [
                            { startedAt: { lt: cursorSession.startedAt } },
                            {
                                startedAt: cursorSession.startedAt,
                                id: { lt: cursorSession.id },
                            },
                        ],
                    }
                    : {}),
            },
            include: {
                chat: {
                    select: {
                        id: true,
                        name: true,
                        isGroup: true,
                    },
                },
                startedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                                profilePhotoType: true,
                                avatarFilename: true,
                            },
                        },
                    },
                    orderBy: { joinedAt: 'asc' },
                },
            },
            orderBy: [
                { startedAt: 'desc' },
                { id: 'desc' },
            ],
            take: PAGE_SIZE + 1,
        })

        const verifiedCalls = calls.filter((call) =>
            call.participants.some((participant) => participant.userId === session.user.id)
        )
        const page = verifiedCalls.slice(0, PAGE_SIZE)
        const nextCursor = verifiedCalls.length > PAGE_SIZE ? page[page.length - 1]?.id ?? null : null

        return Response.json({
            calls: page.map((call) => {
                const otherParticipant = call.participants.find(
                    (participant) => participant.userId !== session.user.id
                )
                const durationSeconds = call.endedAt
                    ? Math.max(
                        0,
                        Math.round((call.endedAt.getTime() - call.startedAt.getTime()) / 1000)
                    )
                    : null

                return {
                    id: call.id,
                    chatId: call.chatId,
                    chatName: call.chat.name,
                    displayName: call.chat.isGroup
                        ? call.chat.name || 'Group call'
                        : otherParticipant?.user.name ||
                        otherParticipant?.user.email ||
                        'Personal call',
                    hmsRoomId: call.hmsRoomId,
                    type: call.type,
                    status: call.status,
                    outcome: getOutcome(call, session.user.id),
                    startedById: call.startedById,
                    startedByName: call.startedBy.name || call.startedBy.email,
                    startedAt: call.startedAt.toISOString(),
                    endedAt: call.endedAt?.toISOString() ?? null,
                    durationSeconds,
                    participants: call.participants.map((participant) => ({
                        id: participant.id,
                        userId: participant.userId,
                        name: participant.user.name,
                        email: participant.user.email,
                        image: participant.user.image,
                        status: participant.status,
                        joinedAt: participant.joinedAt?.toISOString() ?? null,
                        leftAt: participant.leftAt?.toISOString() ?? null,
                        isStarter: participant.userId === call.startedById,
                    })),
                }
            }),
            nextCursor,
        })
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Server error' }, { status: 500 })
    }
}
