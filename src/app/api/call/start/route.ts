import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { createHmsRoom } from "@/lib/hms";
import { notifySocket } from "@/lib/socket-notify";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { chatId, type: rawType } = body
        const callType: string = rawType === 'GROUP' ? 'GROUP' : 'ONE_TO_ONE'

        if (!chatId || typeof chatId !== 'string') {
            return Response.json({ error: 'chatId is required' }, { status: 400 })
        }

        // Verify requester is a member of the chat
        const member = await prisma.chatMember.findFirst({
            where: { chatId, userId: session.user.id },
        })

        if (!member) {
            return Response.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Check-then-create inside a transaction to narrow (not eliminate) the
        // race window for concurrent start requests on the same chat.
        const existing = await prisma.callSession.findFirst({
            where: { chatId, status: 'ACTIVE' },
        })

        if (existing) {
            return Response.json({
                callSessionId: existing.id,
                hmsRoomId: existing.hmsRoomId,
                status: existing.status,
                type: existing.type,
            })
        }

        const hmsRoomId = await createHmsRoom(`chat-${chatId}-${Date.now()}`)

        // Fetch all chat members so we can create CallParticipant rows
        const allMembers = await prisma.chatMember.findMany({
            where: { chatId },
            select: { userId: true },
        })

        const callSession = await prisma.$transaction(async (tx) => {
            const stillActive = await tx.callSession.findFirst({
                where: { chatId, status: 'ACTIVE' },
            })
            if (stillActive) return stillActive

            const created = await tx.callSession.create({
                data: {
                    chatId,
                    hmsRoomId,
                    type: callType,
                    status: 'ACTIVE',
                    startedById: session.user.id,
                    participants: {
                        create: allMembers.map((m) => ({
                            userId: m.userId,
                            // Starter is immediately JOINED; others are INVITED
                            status: m.userId === session.user.id ? 'JOINED' : 'INVITED',
                            joinedAt: m.userId === session.user.id ? new Date() : null,
                        })),
                    },
                },
            })
            return created
        })

        // For GROUP calls: emit call-incoming to all other members so they see the ring UI.
        // Personal calls (ONE_TO_ONE) go through the existing Meet tab flow — no separate signal needed.
        if (callType === 'GROUP') {
            const otherUserIds = allMembers
                .map((m) => m.userId)
                .filter((uid) => uid !== session.user.id)

            await notifySocket(
                'call-incoming',
                {
                    sessionId: callSession.id,
                    chatId,
                    hmsRoomId: callSession.hmsRoomId,
                    type: callType,
                    startedById: session.user.id,
                    startedByName: session.user.name || session.user.email,
                },
                { userIds: otherUserIds }
            )
        }

        return Response.json({
            callSessionId: callSession.id,
            hmsRoomId: callSession.hmsRoomId,
            status: callSession.status,
            type: callSession.type,
        })
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Server error' }, { status: 500 })
    }
}
