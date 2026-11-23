import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { notifySocket } from "@/lib/socket-notify";

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
    const body = await req.json();
    const messageId =
      typeof body.messageId === "string" ? body.messageId : "";
    const emoji = typeof body.emoji === "string" ? body.emoji : "";

    if (!messageId || !emoji || emoji.length > 32) {
      return Response.json({ error: "Invalid reaction." }, { status: 400 });
    }

    const member = await prisma.chatMember.findFirst({
      where: { chatId, userId: session.user.id },
      select: { id: true },
    });
    if (!member) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const message = await prisma.message.findFirst({
      where: { id: messageId, chatId },
      select: { id: true },
    });
    if (!message) {
      return Response.json({ error: "Message not found" }, { status: 404 });
    }

    const existing = await prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId: session.user.id,
          emoji,
        },
      },
    });

    if (existing) {
      await prisma.messageReaction.delete({ where: { id: existing.id } });
    } else {
      await prisma.messageReaction.create({
        data: { messageId, userId: session.user.id, emoji },
      });
    }

    const reactions = await prisma.messageReaction.findMany({
      where: { messageId },
      select: { emoji: true, userId: true },
    });

    await notifySocket(
      "message-reaction",
      { messageId, chatId, reactions },
      { chatId }
    );

    return Response.json({ reactions });
  } catch (error) {
    console.error("POST /api/message/[chatId]/reaction error:", error);
    return Response.json({ error: "Could not update reaction." }, { status: 500 });
  }
}
