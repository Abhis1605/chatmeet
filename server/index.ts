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

const activeConnections = new Map<string, Set<string>>()

const formatLastSeen = (date: Date | string | null | undefined) => {
    if (!date) return null
    return date instanceof Date ? date.toISOString() : new Date(date).toISOString()
}

const setUserPresence = async (userId: string, isOnline: boolean) => {
    await prisma.user.update({
        where: { id: userId },
        data: {
            isOnline,
            lastSeen: isOnline ? null : new Date(),
        },
    })

    io.emit('user-presence-changed', {
        userId,
        isOnline,
        lastSeen: isOnline ? null : formatLastSeen(new Date()),
    })
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

    if (socket.user?.id) {
        const sockets = activeConnections.get(socket.user.id) ?? new Set<string>()
        sockets.add(socket.id)
        activeConnections.set(socket.user.id, sockets)

        if (sockets.size === 1) {
            setUserPresence(socket.user.id, true).catch((error) => {
                console.error('Failed to mark user online:', error)
            })
        }
    }

    socket.onAny((event, ...args) => {
        console.log('Event:', event, args)
    })

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

    socket.on('typing', (chatId) => {
        console.log(`${socket.user?.email} is typing in ${chatId}`)
        socket.to(chatId).emit('user-typing', {
            userId: socket.user?.id,
            name: socket.user?.name
        })
    })

    socket.on('stop-typing', (chatId) => {
        console.log(`${socket.user?.email} stopped typing`)
        socket.to(chatId).emit('user-stop-typing', {
            userId: socket.user?.id
        })
    })

    socket.on('leave-chat', (chatId) => {
        socket.leave(chatId)
    })

    socket.on('disconnect', () => {
        console.log('User disconnected')

        if (!socket.user?.id) return

        const sockets = activeConnections.get(socket.user.id)

        if (!sockets) return

        sockets.delete(socket.id)

        if (sockets.size === 0) {
            activeConnections.delete(socket.user.id)
            setUserPresence(socket.user.id, false).catch((error) => {
                console.error('Failed to mark user offline:', error)
            })
        } else {
            activeConnections.set(socket.user.id, sockets)
        }
    })
})

server.listen(5000, () => {
  console.log("Socket server running on http://localhost:5000");
});