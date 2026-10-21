import { prisma } from "@/lib/prisma";
import { notifySocket } from "@/lib/socket-notify";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await params;
    const lastReadAt = new Date();

    const member = await prisma.chatMember.update({
      where: {
        userId_chatId: {
          userId: session.user.id,
          chatId: chatId,
        },
      },
      data: {
        lastReadAt,
      },
      select: {
        user: { select: { readReceiptsEnabled: true } },
        chat: { select: { members: { select: { userId: true } } } },
      },
    });

    // Live "Seen" for the other members, only if this user shares read receipts
    // (each receiver also hides it if they turned receipts off themselves)
    if (member.user.readReceiptsEnabled) {
      const otherIds = member.chat.members
        .map((m) => m.userId)
        .filter((id) => id !== session.user.id);
      await notifySocket(
        "chat-read",
        { chatId, userId: session.user.id, lastReadAt: lastReadAt.toISOString() },
        { userIds: otherIds }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
