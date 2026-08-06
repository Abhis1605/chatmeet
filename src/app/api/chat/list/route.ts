import { prisma } from "@/lib/prisma";
import { Prisma } from "../../../../generated/prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const chatFilter =
      type === "room"
        ? { isRoom: true }
        : type === "group"
          ? { isGroup: true, isRoom: false }
          : { isGroup: false, isRoom: false };

    // FETCH CHATS
    const chats = await prisma.chat.findMany({
      where: {
        ...chatFilter,
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const chatIds = chats.map((chat) => chat.id);

    const unreadRows = chatIds.length
      ? await prisma.$queryRaw<{ chatId: string; unreadCount: bigint }[]>`
          SELECT m."chatId" as "chatId", COUNT(*)::bigint as "unreadCount"
          FROM "Message" m
          JOIN "ChatMember" cm ON cm."chatId" = m."chatId" AND cm."userId" = ${session.user.id}
          WHERE m."chatId" IN (${Prisma.join(chatIds)})
            AND m."createdAt" > cm."lastReadAt"
          GROUP BY m."chatId"
        `
      : [];
    const unreadByChatId = new Map(
      unreadRows.map((row) => [row.chatId, Number(row.unreadCount)])
    );

    const chatsWithUnread = chats.map((chat) => {
      const lastMessage = chat.messages[0] ? {
        id: chat.messages[0].id,
        content: chat.messages[0].content,
        senderId: chat.messages[0].senderId,
        type: chat.messages[0].type,
        createdAt: chat.messages[0].createdAt.toISOString(),
      } : undefined;

      return {
        ...chat,
        unreadCount: unreadByChatId.get(chat.id) ?? 0,
        lastMessage,
        messages: undefined,
      };
    });

    return Response.json(chatsWithUnread);

  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}