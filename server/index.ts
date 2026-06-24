import express from 'express'
import http from 'http'
import { Server, Socket } from 'socket.io'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'

dotenv.config()

interface SocketUser {
    id: string,
    email: string,
    name?: string
}

interface CustomSocket extends Socket {
    user?: SocketUser
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || '',
})

const prisma = new PrismaClient({ adapter })

const app = express()

const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    }
})

io.use((socket: CustomSocket, next) => {
    try {
        const token = socket.handshake.auth.token

        console.log('Incoming token:', token)

        if (!token){
            return next(new Error('Unauthorized'))
        }

        console.log('Decoded token', token)

        // socket.user = {
        //     id: token.id,
        // email: token.email,
        // name: token.name
        // }

        socket.user = token as SocketUser
        console.log('Socket user:', socket.user)

        next()
    } catch (error) {
        console.error('Auth error:', error)
        next(new Error('Unauthorized'))
    }
})

io.on('connection', (socket: CustomSocket) => {
    console.log('User connected', socket.user?.email)

    socket.on('join-chat', (chatId: string) => {
        if(!chatId) return
        socket.join(chatId)
    })

    socket.on('send-message', async ({ chatId, content }: { chatId: string, content: string }) => {
        try {

            if (!chatId || !content) return 

            const isMember = await prisma.chatMember.findFirst({
                where: {
                    chatId,
                    userId: socket.user?.id
                }
            })

            if (!isMember){
                console.log('Unauthorized message attempt')
                return
            }

            const message = await prisma.message.create({
                data: {
                    content,
                    chatId,
                    senderId: socket.user!.id
                }
            })

            io.to(chatId).emit('new-message', message)

        } catch (error) {
            console.error(error)
        }
    })

    socket.on('leave-chat', (chatId) => {
        socket.leave(chatId)
    })

    socket.on('disconnect', () => {
        console.log('User disconnected')
    })
})

server.listen(5000, () => {
  console.log("Socket server running on http://localhost:5000");
});