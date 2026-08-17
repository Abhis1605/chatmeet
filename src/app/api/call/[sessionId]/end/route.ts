import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]/route"
import { endHmsRoom } from "@/lib/hms"
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
            include: { participants: true },
        })

        if (!callSession) {
            return Response.json({ error: 'Call not found' }, { status: 404 })
        }

        if (callSession.startedById !== session.user.id) {
            return Response.json({ error: 'Only the call starter can end it' }, { status: 403 })
        }

        if (callSession.status !== 'ACTIVE') {
            return Response.json({ error: 'Call already ended' }, { status: 409 })
        }

        try {
            await endHmsRoom(callSession.hmsRoomId)
        } catch (hmsError) {
            console.error('Failed to end 100ms room:', hmsError)
            return Response.json({ error: 'Failed to end call' }, { status: 502 })
        }

        // Determine final session status:
        // MISSED  → no one except the starter ever JOINED
        // ENDED   → at least one other participant joined at some point
        const othersJoined = callSession.participants.some(
            (p) => p.userId !== session.user.id && p.joinedAt !== null
        )
        const finalStatus = othersJoined ? 'ENDED' : 'MISSED'
        const now = new Date()

        const updated = await prisma.$transaction(async (tx) => {
            // Mark still-JOINED participants as LEFT
            await tx.callParticipant.updateMany({
                where: { callSessionId: sessionId, status: 'JOINED' },
                data: { status: 'LEFT', leftAt: now },
            })

            // Mark still-INVITED participants as MISSED
            await tx.callParticipant.updateMany({
                where: { callSessionId: sessionId, status: 'INVITED' },
                data: { status: 'MISSED' },
            })

            return tx.callSession.update({
                where: { id: sessionId },
                data: { status: finalStatus, endedAt: now },
            })
        })

        // Notify all participants that the call has ended
        const participantIds = callSession.participants.map((p) => p.userId)
        await notifySocket(
            'call-ended',
            {
                sessionId,
                chatId: updated.chatId,
                status: updated.status,
            },
            { userIds: participantIds, chatId: updated.chatId }
        )

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

