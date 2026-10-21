import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { notifySocket } from "@/lib/socket-notify";

async function getMember(chatId: string, userId: string) {
  return prisma.chatMember.findFirst({ where: { chatId, userId } });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await params;
    const cursor = new URL(req.url).searchParams.get("cursor");
    if (!(await getMember(chatId, session.user.id))) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "desc" },
      take: 50,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { sender: true },
    });

    const nextCursor = messages.length === 50 ? messages[messages.length - 1].id : null;
    return Response.json({ messages: messages.reverse(), nextCursor });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
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
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const messageId = typeof body.messageId === "string" ? body.messageId : "";

    if (!messageId || !content || content.length > 5000) {
      return Response.json({ error: "A valid message is required" }, { status: 400 });
    }
    if (!(await getMember(chatId, session.user.id))) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const existing = await prisma.message.findFirst({
      where: { id: messageId, chatId, senderId: session.user.id, type: "TEXT" },
    });
    if (!existing) {
      return Response.json({ error: "Message not found or cannot be edited" }, { status: 404 });
    }

    const message = await prisma.message.update({
      where: { id: messageId },
      data: { content },
      include: { sender: true },
    });
    await notifySocket("message-updated", message, { chatId });
    return Response.json({ message });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await params;
    const messageId = new URL(req.url).searchParams.get("messageId");
    if (!messageId) {
      return Response.json({ error: "messageId is required" }, { status: 400 });
    }
    if (!(await getMember(chatId, session.user.id))) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const existing = await prisma.message.findFirst({
      where: { id: messageId, chatId, senderId: session.user.id },
      select: { id: true },
    });
    if (!existing) {
      return Response.json({ error: "Message not found or cannot be deleted" }, { status: 404 });
    }

    await prisma.message.delete({ where: { id: messageId } });
    await notifySocket("message-deleted", { id: messageId, chatId }, { chatId });
    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
