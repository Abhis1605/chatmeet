import { prisma } from '@/lib/prisma'

export async function GET(req: Request){
    try {
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
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                isOnline: true,
                lastSeen: true
            },
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