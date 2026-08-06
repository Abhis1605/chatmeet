import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { createHmsRoom } from "@/lib/hms";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { chatId } = await req.json()

        if (!chatId || typeof chatId !== 'string') {
            return Response.json({ error: 'chatId is required' }, { status: 400 })
        }

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
            })
        }

        const hmsRoomId = await createHmsRoom(`chat-${chatId}-${Date.now()}`)

        const callSession = await prisma.$transaction(async (tx) => {
            const stillActive = await tx.callSession.findFirst({
                where: { chatId, status: 'ACTIVE' },
            })
            if (stillActive) return stillActive

            return tx.callSession.create({
                data: {
                    chatId,
                    hmsRoomId,
                    status: 'ACTIVE',
                    startedById: session.user.id,
                },
            })
        })

        return Response.json({
            callSessionId: callSession.id,
            hmsRoomId: callSession.hmsRoomId,
            status: callSession.status,
        })
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Server error' }, { status: 500 })
    }
}
