import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { rateLimit } from '@/lib/rate-limit'
import { publicUserSelect } from '@/lib/public-user'

export async function GET(req: Request){
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!rateLimit(`user-search:${session.user.id}`, 30, 60_000).ok) {
            return Response.json({ error: 'Too many requests' }, { status: 429 })
        }

        const { searchParams }  = new URL(req.url)
        const query = searchParams.get('email')

        if (!query){
            return Response.json([], { status: 200 })
        }

        const users = await prisma.user.findMany({
            where: {
                email: {
                    contains: query,
                    mode: 'insensitive'
                },
            },
            select: publicUserSelect,
            take: 5
        })

        return Response.json(users)
    } catch (error) {
        console.error(error)
        return Response.json({
            error: "Server error"
        }, {
            status: 500
        })
    }
}
