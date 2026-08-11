import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]/route"
import { generateHmsAuthToken } from "@/lib/hms"

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

        if (callSession.status !== 'ACTIVE') {
            return Response.json({ error: 'Call has ended' }, { status: 409 })
        }

        const userName = session.user.name || session.user.email || 'Guest'

        const token = await generateHmsAuthToken({
            hmsRoomId: callSession.hmsRoomId,
            userId: session.user.id,
            userName,
            role: 'guest',
        })

        return Response.json({
            token,
            hmsRoomId: callSession.hmsRoomId,
            userName,
        })
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Server error' }, { status: 500 })
    }
}
