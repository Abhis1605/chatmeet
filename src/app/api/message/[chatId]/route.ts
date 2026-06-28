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
                createdAt: 'asc'
            },
            include: {
                sender: true
            }
        })

        return Response.json(messages)
    } catch (error) {
        console.error(error)
        return Response.json({
            error: 'Server error'
        }, {
            status: 500
        })
    }
}
