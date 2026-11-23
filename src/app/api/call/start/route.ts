import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { createHmsRoom, discardHmsRoom } from "@/lib/hms";
import { notifySocket } from "@/lib/socket-notify";

export async function POST(req: Request) {
    try {
        if (!process.env.HMS_ACCESS_KEY || !process.env.HMS_SECRET || !process.env.HMS_TEMPLATE_ID) {
            return Response.json({
                error: "Calling is not configured. Add HMS_ACCESS_KEY, HMS_SECRET, and HMS_TEMPLATE_ID.",
            }, { status: 503 });
        }

        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { chatId, type: rawType, mediaType: rawMediaType } = body
        const callType: string = rawType === 'GROUP' ? 'GROUP' : 'ONE_TO_ONE'
        const callMediaType: string = rawMediaType === 'AUDIO' ? 'AUDIO' : 'VIDEO'

        if (!chatId || typeof chatId !== 'string') {
            return Response.json({ error: 'chatId is required' }, { status: 400 })
        }

        // Verify requester is a member of the chat
        const member = await prisma.chatMember.findFirst({
            where: { chatId, userId: session.user.id },
        })

        if (!member) {
            return Response.json({ error: 'Forbidden' }, { status: 403 })
        }

        let createdHmsRoomId: string | null = null;
        const createOrGetCallSession = () => prisma.$transaction(async (tx) => {
            // Serialize starts for this chat across all app instances. The
            // lock is held until the session and participants are committed.
            await tx.$queryRaw`SELECT pg_advisory_xact_lock(0, hashtext(${chatId}))`;

            const existing = await tx.callSession.findFirst({
                where: { chatId, status: 'ACTIVE' },
            });
            if (existing) return { callSession: existing, otherUserIds: [], created: false };

            const allMembers = await tx.chatMember.findMany({
                where: { chatId },
                select: { userId: true },
            });

            const hmsRoomId = await createHmsRoom(`chat-${chatId}-${Date.now()}`);
            createdHmsRoomId = hmsRoomId;

            const callSession = await tx.callSession.create({
                data: {
                    chatId,
                    hmsRoomId,
                    type: callType,
                    mediaType: callMediaType,
                    status: 'ACTIVE',
                    startedById: session.user.id,
                    participants: {
                        create: allMembers.map((m) => ({
                            userId: m.userId,
                            status: m.userId === session.user.id ? 'JOINED' : 'INVITED',
                            joinedAt: m.userId === session.user.id ? new Date() : null,
                        })),
                    },
                },
            });

            return {
                callSession,
                otherUserIds: allMembers.map((m) => m.userId).filter((uid) => uid !== session.user.id),
                created: true,
            };
        }, { timeout: 30_000 });

        let result: Awaited<ReturnType<typeof createOrGetCallSession>>;
        try {
            result = await createOrGetCallSession();
        } catch (error) {
            if (createdHmsRoomId) {
                try {
                    await discardHmsRoom(createdHmsRoomId);
                } catch (cleanupError) {
                    console.error('Failed to disable unused 100ms room:', cleanupError);
                }
            }
            throw error;
        }

        const { callSession } = result;
        if (result.created) {
            await notifySocket(
                'call-incoming',
                {
                    sessionId: callSession.id,
                    chatId,
                    hmsRoomId: callSession.hmsRoomId,
                    type: callType,
                    mediaType: callSession.mediaType,
                    startedById: session.user.id,
                    startedByName: session.user.name || session.user.email,
                },
                { userIds: result.otherUserIds }
            );
        }

        return Response.json({
            callSessionId: callSession.id,
            hmsRoomId: callSession.hmsRoomId,
            status: callSession.status,
            type: callSession.type,
            mediaType: callSession.mediaType,
        })
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Server error' }, { status: 500 })
    }
}
