import { prisma } from "@/lib/prisma"


export async function GET(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
    try {
        const { chatId } = await params
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