import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]/route"
import { notifySocket } from "@/lib/socket-notify"

export async function POST(
    req: Request,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { sessionId } = await params

        const callSession = await prisma.callSession.findUnique({
            where: { id: sessionId },
        })

        if (!callSession) {
            return Response.json({ error: 'Call not found' }, { status: 404 })
        }

        const member = await prisma.chatMember.findFirst({
            where: { chatId: callSession.chatId, userId: session.user.id },
        })

        if (!member) {
            return Response.json({ error: 'Forbidden' }, { status: 403 })
        }

        const updated = await prisma.$transaction(async (tx) => {
            const leftAt = new Date()

            await tx.callParticipant.upsert({
                where: {
                    callSessionId_userId: {
                        callSessionId: callSession.id,
                        userId: session.user.id,
                    },
                },
                create: {
                    callSessionId: callSession.id,
                    userId: session.user.id,
                    status: 'LEFT',
                    leftAt,
                },
                update: {
                    status: 'LEFT',
                    leftAt,
                },
            })

            const remainingJoined = await tx.callParticipant.count({
                where: {
                    callSessionId: callSession.id,
                    status: 'JOINED',
                },
            })

            if (remainingJoined > 0 || callSession.status !== 'ACTIVE') {
                return tx.callSession.findUniqueOrThrow({
                    where: { id: callSession.id },
                })
            }

            const hadOtherJoin = await tx.callParticipant.count({
                where: {
                    callSessionId: callSession.id,
                    userId: { not: callSession.startedById },
                    joinedAt: { not: null },
                },
            })

            return tx.callSession.update({
                where: { id: callSession.id },
                data: {
                    status: hadOtherJoin > 0 ? 'ENDED' : 'MISSED',
                    endedAt: leftAt,
                },
            })
        })

        if (updated.status !== 'ACTIVE') {
            const participants = await prisma.callParticipant.findMany({
                where: { callSessionId: sessionId },
                select: { userId: true },
            })

            await notifySocket(
                'call-ended',
                {
                    sessionId,
                    chatId: updated.chatId,
                    status: updated.status,
                },
                { userIds: participants.map((participant) => participant.userId), chatId: updated.chatId }
            )
        }

        return Response.json({
            callSession: {
                id: updated.id,
                chatId: updated.chatId,
                hmsRoomId: updated.hmsRoomId,
                type: updated.type,
                status: updated.status,
                startedById: updated.startedById,
                startedAt: updated.startedAt.toISOString(),
                endedAt: updated.endedAt?.toISOString() ?? null,
            },
        })
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Server error' }, { status: 500 })
    }
}
