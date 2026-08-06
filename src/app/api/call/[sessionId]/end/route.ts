import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]/route"
import { endHmsRoom } from "@/lib/hms"

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

        const updated = await prisma.callSession.update({
            where: { id: sessionId },
            data: { status: 'ENDED', endedAt: new Date() },
        })

        return Response.json({
            callSession: {
                id: updated.id,
                chatId: updated.chatId,
                hmsRoomId: updated.hmsRoomId,
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
