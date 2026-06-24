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
        console.log('Socket user set to:', socket.user)

        next()
    } catch (error) {
        console.error('Auth error detail:', error)
        next(new Error('Unauthorized'))
    }
})

io.on('connection', (socket: CustomSocket) => {
    console.log('User connected - ID:', socket.user?.id, 'Email:', socket.user?.email)

    socket.on('join-chat', (chatId: string) => {
        if(!chatId) return
        socket.join(chatId)
        console.log(`User ${socket.user?.email} joined room: ${chatId}`)
    })

    socket.on('send-message', async ({ chatId, content }: { chatId: string, content: string }) => {
        try {
            console.log(`Message from ${socket.user?.email} to ${chatId}: ${content}`)
            if (!chatId || !content) return 

            const isMember = await prisma.chatMember.findFirst({
                where: {
                    chatId,
                    userId: socket.user?.id
                }
            })

            if (!isMember){
                console.log('Unauthorized message attempt by', socket.user?.id, 'for chat', chatId)
                return
            }

            const message = await prisma.message.create({
                data: {
                    content,
                    chatId,
                    senderId: socket.user!.id
                }
            })

            console.log('Message created in DB, emitting...')
            io.to(chatId).emit('new-message', message)
            // Also notify the specific user to refresh their chat list if it's a new chat for them
            io.emit('chat-updated', { chatId, senderId: socket.user?.id })

        } catch (error) {
            console.error('Socket send-message error:', error)
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