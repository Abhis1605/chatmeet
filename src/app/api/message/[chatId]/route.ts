import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"


export async function GET(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { chatId } = await params
        const { searchParams } = new URL(req.url)
        const cursor = searchParams.get('cursor')

        const member = await prisma.chatMember.findFirst({
            where: {
                chatId,
                userId: session.user.id
            }
        })

        if (!member) {
            return Response.json({ error: 'Forbidden' }, { status: 403 })
        }

        const messages = await prisma.message.findMany({
            where: {
                chatId,
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            include: {
                sender: true
            }
        })

        const nextCursor = messages.length === 50 ? messages[messages.length - 1].id : null

        return Response.json({ messages: messages.reverse(), nextCursor })
    } catch (error) {
        console.error(error)
        return Response.json({
            error: 'Server error'
        }, {
            status: 500
        })
    }
}
