import express from 'express'
import http from 'http'
import { Server, Socket } from 'socket.io'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import { canSendGroupMessage } from '../src/lib/groupPermissions'
import { messageInclude } from '../src/lib/message-include'
import { buildLinkPreview, extractFirstUrl } from '../src/lib/link-preview'
import { EVERYONE_MENTION, extractMentionTokens } from '../src/lib/mentions'

dotenv.config({ path: ['.env.local', '.env'] })

const JWT_SECRET = process.env.NEXTAUTH_SECRET
const NOTIFY_SECRET = process.env.SOCKET_NOTIFY_SECRET
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN
const PORT = Number(process.env.SOCKET_PORT || process.env.PORT || 5000)

if (!JWT_SECRET || !NOTIFY_SECRET || !CLIENT_ORIGIN) {
    throw new Error('NEXTAUTH_SECRET, SOCKET_NOTIFY_SECRET, and CLIENT_ORIGIN must be set for the socket server')
}

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

// Derives presence from live connections at write time so out-of-order
// connect/disconnect writes always settle on the real state.
//
// User.isOnline / User.lastSeen hold what OTHER users may see, after the
// user's privacy settings are applied. Every API reads those columns, so
// filtering here covers all of them.
const setUserPresence = async (userId: string) => {
    const connected = (activeConnections.get(userId)?.size ?? 0) > 0

    const prefs = await prisma.user.findUnique({
        where: { id: userId },
        select: { statusPreference: true, showOnlineStatus: true, showLastSeen: true },
    })
    if (!prefs) return

    // Invisible and Do Not Disturb hide presence. Away remains visible as online.
    const invisible = prefs.statusPreference === 'INVISIBLE'
    const suppressPresence = invisible || prefs.statusPreference === 'DND'
    const isOnline = connected && !suppressPresence && prefs.showOnlineStatus
    const lastSeen = !connected && !suppressPresence && prefs.showLastSeen ? new Date() : null

    await prisma.user.update({
        where: { id: userId },
        data: { isOnline, lastSeen },
    })

    io.emit('user-presence-changed', {
        userId,
        isOnline,
        lastSeen: formatLastSeen(lastSeen),
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

// Resolves @username tokens (and @everyone) to the members of a chat.
const resolveMentionUserIds = async (
    chatId: string,
    content: string | null | undefined,
    senderId: string,
) => {
    const tokens = extractMentionTokens(content)
    if (!tokens.length) return []

    const members = await prisma.chatMember.findMany({
        where: { chatId },
        select: { userId: true, user: { select: { username: true } } },
    })

    const wantsEveryone = tokens.includes(EVERYONE_MENTION)
    const ids = new Set<string>()
    for (const member of members) {
        if (member.userId === senderId) continue
        if (wantsEveryone) {
            ids.add(member.userId)
            continue
        }
        const username = member.user.username?.toLowerCase()
        if (username && tokens.includes(username)) ids.add(member.userId)
    }
    return [...ids]
}

// Marks a message as delivered to every recipient that currently has a live
// socket, then tells the chat so senders can show "Delivered".
const markDeliveredForOnlineRecipients = async (chatId: string, senderId: string) => {
    const members = await prisma.chatMember.findMany({
        where: { chatId, userId: { not: senderId } },
        select: { userId: true },
    })

    const onlineIds = members
        .map((member) => member.userId)
        .filter((userId) => (activeConnections.get(userId)?.size ?? 0) > 0)
    if (!onlineIds.length) return

    const now = new Date()
    await prisma.chatMember.updateMany({
        where: { chatId, userId: { in: onlineIds } },
        data: { lastDeliveredAt: now },
    })

    for (const userId of onlineIds) {
        io.to(chatId).emit('chat-delivered', {
            chatId,
            userId,
            lastDeliveredAt: now.toISOString(),
        })
    }
}

const endCallsForDisconnectedUser = async (userId: string) => {
    const activeParticipants = await prisma.callParticipant.findMany({
        where: {
            userId,
            status: 'JOINED',
            callSession: { status: 'ACTIVE' },
        },
        select: {
            callSessionId: true,
            callSession: {
                select: {
                    chatId: true,
                    startedById: true,
                },
            },
        },
    })

    for (const participant of activeParticipants) {
        const now = new Date()
        const updated = await prisma.$transaction(async (tx) => {
            await tx.callParticipant.update({
                where: {
                    callSessionId_userId: {
                        callSessionId: participant.callSessionId,
                        userId,
                    },
                },
                data: { status: 'LEFT', leftAt: now },
            })

            const joinedCount = await tx.callParticipant.count({
                where: {
                    callSessionId: participant.callSessionId,
                    status: 'JOINED',
                },
            })

            if (joinedCount > 0) {
                return null
            }

            const otherJoined = await tx.callParticipant.count({
                where: {
                    callSessionId: participant.callSessionId,
                    userId: { not: participant.callSession.startedById },
                    joinedAt: { not: null },
                },
            })

            return tx.callSession.update({
                where: { id: participant.callSessionId },
                data: {
                    status: otherJoined > 0 ? 'ENDED' : 'MISSED',
                    endedAt: now,
                },
                select: { id: true, chatId: true, status: true },
            })
        })

        if (updated) {
            io.to(updated.chatId).emit('call-ended', {
                sessionId: updated.id,
                chatId: updated.chatId,
                status: updated.status,
            })
        }
    }
}

app.post('/notify', (req, res) => {
    if (req.get('x-notify-secret') !== NOTIFY_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const { event, payload, userIds, chatId, broadcast } = req.body ?? {}

    if (!event) {
        return res.status(400).json({ error: 'event is required' })
    }

    // Password reset/change: tell the user's other connections to sign out, then cut them off
    if (event === 'session-revoked' && Array.isArray(userIds)) {
        for (const userId of userIds) {
            for (const socketId of activeConnections.get(userId) ?? []) {
                if (socketId === payload?.keepSocketId) continue
                const target = io.sockets.sockets.get(socketId)
                target?.emit('session-revoked')
                target?.disconnect(true)
            }
        }
        return res.json({ ok: true })
    }

    // Privacy settings changed: recompute and re-broadcast what others see
    if (event === 'presence-refresh' && Array.isArray(userIds)) {
        for (const userId of userIds) {
            setUserPresence(userId).catch((error) => {
                console.error('Failed to refresh presence:', error)
            })
        }
        return res.json({ ok: true })
    }

    if (broadcast) {
        io.emit(event, payload)
    }

    if (Array.isArray(userIds) && userIds.length > 0) {
        emitToUsers(userIds, event, payload)
    }

    if (chatId) {
        io.to(chatId).emit(event, payload)
    }

    return res.json({ ok: true })
})

export const server = http.createServer(app)

const io = new Server(server, {
    // Detect abruptly closed tabs (e.g. incognito) within ~15s instead of ~45s
    pingInterval: 10000,
    pingTimeout: 5000,
    cors: {
        origin: CLIENT_ORIGIN,
        methods: ['GET', 'POST'],
        credentials: true
    }
})

io.use(async (socket: CustomSocket, next) => {
    try {
        const token = socket.handshake.auth.token

        if (typeof token !== 'string') {
            return next(new Error('Unauthorized'))
        }

        // Throws if the signature is invalid or the token has expired
        const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & Partial<SocketUser>

        if (!decoded.id) {
            return next(new Error('Unauthorized'))
        }

        // Socket tokens issued before the last password change are no longer valid
        const dbUser = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { passwordChangedAt: true },
        })
        if (!dbUser) {
            return next(new Error('Unauthorized'))
        }
        const changedAt = dbUser.passwordChangedAt?.getTime()
        // iat is in whole seconds, so compare at second precision
        if (changedAt && (decoded.iat ?? 0) < Math.floor(changedAt / 1000)) {
            return next(new Error('Unauthorized'))
        }

        socket.user = { id: decoded.id, email: decoded.email ?? '', name: decoded.name }
        next()
    } catch {
        next(new Error('Unauthorized'))
    }
})

io.on('connection', (socket: CustomSocket) => {
    console.log('User connected:', socket.user?.id)

    if (socket.user?.id) {
        const sockets = activeConnections.get(socket.user.id) ?? new Set<string>()
        sockets.add(socket.id)
        activeConnections.set(socket.user.id, sockets)

        setUserPresence(socket.user.id).catch((error) => {
            console.error('Failed to refresh user presence on connect:', error)
        })

        // A live socket means undelivered messages have now reached the device.
        // Mark them delivered and broadcast so senders can update status.
        prisma.chatMember.findMany({
            where: { userId: socket.user.id },
            select: { chatId: true },
        }).then(async (memberships) => {
            if (!memberships.length) return
            const now = new Date()
            await prisma.chatMember.updateMany({
                where: { userId: socket.user!.id },
                data: { lastDeliveredAt: now },
            })
            for (const membership of memberships) {
                io.to(membership.chatId).emit('chat-delivered', {
                    chatId: membership.chatId,
                    userId: socket.user!.id,
                    lastDeliveredAt: now.toISOString(),
                })
            }
        }).catch((error) => {
            console.error('Failed to mark messages delivered on connect:', error)
        })

        // Send current public presence for existing chat and room members to
        // this socket so its client cache starts from live values after login.
        prisma.chatMember.findMany({
            where: { userId: socket.user.id },
            select: {
                chat: {
                    select: {
                        members: { select: { userId: true } },
                    },
                },
            },
        }).then(async (memberships) => {
            const otherUserIds = [...new Set(
                memberships.flatMap((membership) => membership.chat.members.map((member) => member.userId))
                    .filter((userId) => userId !== socket.user?.id)
            )]
            if (!otherUserIds.length) return

            await Promise.all(otherUserIds.map((userId) => setUserPresence(userId)))

            const users = await prisma.user.findMany({
                where: { id: { in: otherUserIds } },
                select: { id: true, isOnline: true, lastSeen: true },
            })
            for (const user of users) {
                socket.emit('user-presence-changed', {
                    userId: user.id,
                    isOnline: user.isOnline,
                    lastSeen: formatLastSeen(user.lastSeen),
                })
            }
        }).catch((error) => {
            console.error('Failed to send initial user presence:', error)
        })
    }

    socket.on('join-chat', async (chatId: string) => {
        try {
            if (typeof chatId !== 'string' || !chatId || !socket.user?.id) return

            const member = await prisma.chatMember.findFirst({
                where: { chatId, userId: socket.user.id },
                select: { id: true },
            })

            if (!member) {
                console.log('Rejected join-chat for non-member', socket.user.id, chatId)
                return
            }

            socket.join(chatId)
        } catch (error) {
            console.error('Socket join-chat error:', error)
        }
    })

    socket.on('send-message', async ({ chatId, content, type, fileUrl, fileName, fileType, fileSize, parentId: rawParentId }: { chatId: string, content?: string, type: 'TEXT' | 'IMAGE' | 'FILE' | 'VIDEO' | 'AUDIO', fileUrl?: string, fileName?: string, fileType?: string, fileSize?: number, parentId?: string }) => {
        try {
            if (!chatId) return

            const senderId = socket.user?.id
            if (!senderId) return

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

            // A reply must quote a message in the same chat. If the quoted
            // message is itself a reply, flatten it to its thread root so
            // threads never nest more than one level.
            let parentId: string | undefined
            if (typeof rawParentId === 'string' && rawParentId) {
                const parent = await prisma.message.findFirst({
                    where: { id: rawParentId, chatId },
                    select: { id: true, parentId: true },
                })
                parentId = parent ? (parent.parentId ?? parent.id) : undefined
            }

            const mentionUserIds = await resolveMentionUserIds(chatId, content, senderId)

            const message = await prisma.message.create({
                data: {
                    chatId,
                    senderId: socket.user!.id,
                    type,
                    content,
                    parentId,

                    fileUrl,
                    fileName,
                    fileType,
                    fileSize,

                    ...(mentionUserIds.length
                        ? { mentions: { create: mentionUserIds.map((userId) => ({ userId })) } }
                        : {}),
                },
                include: messageInclude,
            })

            console.log('Message created in DB, emitting...')
            io.to(chatId).emit('new-message', message)

            // Notify only this chat's participants to refresh their chat list
            const members = await prisma.chatMember.findMany({
                where: { chatId },
                select: { userId: true },
            })
            emitToUsers(members.map((m) => m.userId), 'chat-updated', { chatId, senderId: socket.user?.id })

            // Mention notifications: targeted toast + mention badge refresh.
            if (mentionUserIds.length) {
                emitToUsers(mentionUserIds, 'mention-received', { message, chatId })
            }

            // Update delivery receipts for every recipient currently online.
            markDeliveredForOnlineRecipients(chatId, senderId).catch((error) => {
                console.error('Failed to mark message delivered:', error)
            })

            // Link previews are fetched after the message is already visible so
            // a slow/unreachable site never delays message delivery.
            if (type === 'TEXT' && extractFirstUrl(content)) {
                buildLinkPreview(content)
                    .then(async (linkPreview) => {
                        if (!linkPreview) return
                        const updated = await prisma.message.update({
                            where: { id: message.id },
                            data: { linkPreview: linkPreview as any },
                            include: messageInclude,
                        })
                        io.to(chatId).emit('message-updated', updated)
                    })
                    .catch((error) => {
                        console.error('Failed to build link preview:', error)
                    })
            }

        } catch (error) {
            console.error('Socket send-message error:', error)
        }
    })

    // ── Emoji reactions ───────────────────────────────────────────────
    socket.on('toggle-reaction', async ({ messageId, emoji }: { messageId?: string, emoji?: string }) => {
        try {
            if (typeof messageId !== 'string' || !messageId || !socket.user?.id) return
            if (typeof emoji !== 'string' || !emoji || emoji.length > 32) return

            const message = await prisma.message.findUnique({
                where: { id: messageId },
                select: { id: true, chatId: true },
            })
            if (!message) return

            const member = await prisma.chatMember.findFirst({
                where: { chatId: message.chatId, userId: socket.user.id },
                select: { id: true },
            })
            if (!member) return

            const existing = await prisma.messageReaction.findUnique({
                where: {
                    messageId_userId_emoji: {
                        messageId,
                        userId: socket.user.id,
                        emoji,
                    },
                },
            })

            if (existing) {
                await prisma.messageReaction.delete({ where: { id: existing.id } })
            } else {
                await prisma.messageReaction.create({
                    data: { messageId, userId: socket.user.id, emoji },
                })
            }

            const reactions = await prisma.messageReaction.findMany({
                where: { messageId },
                select: { emoji: true, userId: true },
            })

            io.to(message.chatId).emit('message-reaction', {
                messageId,
                chatId: message.chatId,
                reactions,
            })
        } catch (error) {
            console.error('Socket toggle-reaction error:', error)
        }
    })


    // Only sockets that passed the join-chat membership check can signal typing
    socket.on('typing', async (chatId: unknown) => {
        if (typeof chatId !== 'string' || !socket.user?.id || !socket.rooms.has(chatId)) return
        const prefs = await prisma.user.findUnique({ where: { id: socket.user.id }, select: { showTypingIndicator: true } })
        if (!prefs?.showTypingIndicator) return
        socket.to(chatId).emit('user-typing', {
            userId: socket.user?.id,
            name: socket.user?.name
        })
    })

    socket.on('stop-typing', (chatId: unknown) => {
        if (typeof chatId !== 'string' || !socket.rooms.has(chatId)) return
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
            endCallsForDisconnectedUser(socket.user.id).catch((error) => {
                console.error('Failed to close calls for disconnected user:', error)
            })
            setUserPresence(socket.user.id).catch((error) => {
                console.error('Failed to mark user offline:', error)
            })
        } else {
            activeConnections.set(socket.user.id, sockets)
        }
    })
})

// In-memory connections are lost on restart, so clear any stale online flags
// before accepting connections.
if (process.env.VERCEL) {
    // Vercel owns the HTTP listener and invokes the exported server from
    // api/socket-io.ts. Do not bind a port or reset shared presence state
    // during a function cold start.
} else {
    prisma.user
        .updateMany({
            where: { isOnline: true },
            data: { isOnline: false, lastSeen: new Date() },
        })
        .catch((error) => console.error('Failed to reset presence on startup:', error))
        .finally(() => {
            server.listen(PORT, () => {
                console.log(`Socket server running on port ${PORT}`);
            });
        });
}
