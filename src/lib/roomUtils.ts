import { prisma } from "@/lib/prisma";

/** Generates a 6-char code avoiding ambiguous chars: 0,O,1,I,L */
export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function uniqueRoomCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateRoomCode();
    const existing = await prisma.chat.findUnique({ where: { roomCode: code } });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique room code after 10 attempts");
}

export const roomInclude = {
  members: { include: { user: true } },
  messages: {
    take: 1,
    orderBy: { createdAt: "desc" as const },
  },
};

export async function formatRoomWithMeta(
  chat: Awaited<ReturnType<typeof prisma.chat.findFirst>> & {
    members: Array<{ userId: string; lastReadAt: Date; user: unknown }>;
    messages: Array<{
      id: string;
      content: string | null;
      senderId: string;
      type: string;
      createdAt: Date;
    }>;
  },
  userId: string
) {
  const currentMember = chat.members.find((m) => m.userId === userId);
  const lastReadAt = currentMember?.lastReadAt;

  let unreadCount = 0;
  if (lastReadAt) {
    unreadCount = await prisma.message.count({
      where: {
        chatId: chat.id,
        createdAt: { gt: lastReadAt },
      },
    });
  }

  const lastMessage = chat.messages[0]
    ? {
        id: chat.messages[0].id,
        content: chat.messages[0].content,
        senderId: chat.messages[0].senderId,
        type: chat.messages[0].type,
        createdAt: chat.messages[0].createdAt.toISOString(),
      }
    : undefined;

  const { messages: _messages, ...rest } = chat;
  return { ...rest, unreadCount, lastMessage };
}

export async function getRoomMember(chatId: string, userId: string) {
  return prisma.chatMember.findFirst({
    where: {
      chatId,
      userId,
      chat: { isRoom: true },
    },
  });
}
