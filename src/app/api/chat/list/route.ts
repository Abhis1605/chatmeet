import { prisma } from "@/lib/prisma";
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

    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {
        const currentMember = chat.members.find(
          (m) => m.userId === session.user.id
        );
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

        const lastMessage = chat.messages[0] ? {
          id: chat.messages[0].id,
          content: chat.messages[0].content,
          senderId: chat.messages[0].senderId,
          type: chat.messages[0].type,
          createdAt: chat.messages[0].createdAt.toISOString(),
        } : undefined;

        return { ...chat, unreadCount, lastMessage, messages: undefined };
      })
    );

    return Response.json(chatsWithUnread);

  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}