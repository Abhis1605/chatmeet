import express from 'express'
import http from 'http'
import { Server, Socket } from 'socket.io'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'
import { canSendGroupMessage } from '../src/lib/groupPermissions'

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
app.use(express.json())

const emitToUsers = (userIds: string[], event: string, payload: unknown) => {
    for (const userId of userIds) {
        const socketIds = activeConnections.get(userId)
        if (!socketIds) continue
        for (const socketId of socketIds) {
            io.to(socketId).emit(event, payload)
        }
    }
}

app.post('/notify', (req, res) => {
    const { event, payload, userIds, chatId } = req.body ?? {}

    if (!event) {
        return res.status(400).json({ error: 'event is required' })
    }

    if (Array.isArray(userIds) && userIds.length > 0) {
        emitToUsers(userIds, event, payload)
    }

    if (chatId) {
        io.to(chatId).emit(event, payload)
    }

    return res.json({ ok: true })
})

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

        if (!token) {
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
        if (!chatId) return
        socket.join(chatId)
        console.log(`User ${socket.user?.email} joined room: ${chatId}`)
    })

    socket.on('send-message', async ({ chatId, content, type, fileUrl, fileName, fileType, fileSize }: { chatId: string, content?: string, type: 'TEXT' | 'IMAGE' | 'FILE' | 'VIDEO', fileUrl?: string, fileName?: string, fileType?: string, fileSize?: number }) => {
        try {
            console.log(`Message from ${socket.user?.email} to ${chatId}: ${content}`)
            if (!chatId) return

            if (type === 'TEXT' && !content) {
                return
            }

            const member = await prisma.chatMember.findFirst({
                where: {
                    chatId,
                    userId: socket.user?.id
                },
                include: {
                    chat: true
                }
            })

            if (!member) {
                console.log('Unauthorized message attempt by', socket.user?.id, 'for chat', chatId)
                return
            }

            if (member.chat.isGroup && !canSendGroupMessage(member)) {
                console.log('Read-only group member message attempt by', socket.user?.id, 'for chat', chatId)
                socket.emit('message-denied', {
                    chatId,
                    reason: 'You do not have permission to message in this group.'
                })
                return
            }

            const message = await prisma.message.create({
                data: {
                    chatId,
                    senderId: socket.user!.id,
                    type,
                    content,

                    fileUrl,
                    fileName,
                    fileType,
                    fileSize,
                },
                include: {
                    sender: true
                }
            })

            console.log('Message created in DB, emitting...')
            io.to(chatId).emit('new-message', message)

            // Notify only this chat's participants to refresh their chat list
            const members = await prisma.chatMember.findMany({
                where: { chatId },
                select: { userId: true },
            })
            emitToUsers(members.map((m) => m.userId), 'chat-updated', { chatId, senderId: socket.user?.id })

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
