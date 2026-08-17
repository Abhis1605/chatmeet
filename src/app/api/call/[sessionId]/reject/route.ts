import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]/route"

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

        const participant = await prisma.callParticipant.findUnique({
            where: {
                callSessionId_userId: {
                    callSessionId: callSession.id,
                    userId: session.user.id,
                },
            },
        })

        if (participant?.status === 'JOINED') {
            return Response.json({ error: 'Joined calls must be left, not declined' }, { status: 409 })
        }

        const updated = await prisma.callParticipant.upsert({
            where: {
                callSessionId_userId: {
                    callSessionId: callSession.id,
                    userId: session.user.id,
                },
            },
            create: {
                callSessionId: callSession.id,
                userId: session.user.id,
                status: 'REJECTED',
            },
            update: {
                status: 'REJECTED',
            },
        })

        return Response.json({
            callSession: {
                id: callSession.id,
                chatId: callSession.chatId,
                hmsRoomId: callSession.hmsRoomId,
                type: callSession.type,
                status: callSession.status,
                startedById: callSession.startedById,
                startedAt: callSession.startedAt.toISOString(),
                endedAt: callSession.endedAt?.toISOString() ?? null,
            },
            participant: updated,
        })
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Server error' }, { status: 500 })
    }
}
