import { prisma } from "@/lib/prisma";
import { messageInclude } from "@/lib/message-include";
import { notifySocket } from "@/lib/socket-notify";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

// POST /api/message/[chatId]/forward — body: { messageId, targetChatIds }
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
    const messageId = typeof body.messageId === "string" ? body.messageId : "";
    const rawTargetChatIds: unknown[] = Array.isArray(body.targetChatIds)
      ? body.targetChatIds
      : [];
    const targetChatIds = rawTargetChatIds.reduce<string[]>((ids, id) => {
      if (typeof id === "string" && !ids.includes(id) && ids.length < 10) {
        ids.push(id);
      }
      return ids;
    }, []);

    if (!messageId || !targetChatIds.length) {
      return Response.json(
        { error: "messageId and at least one target chat are required" },
        { status: 400 }
      );
    }

    const sourceMember = await prisma.chatMember.findFirst({
      where: { chatId, userId: session.user.id },
      select: { id: true },
    });
    if (!sourceMember) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const source = await prisma.message.findFirst({
      where: { id: messageId, chatId },
    });
    if (!source) {
      return Response.json({ error: "Message not found" }, { status: 404 });
    }

    const memberships = await prisma.chatMember.findMany({
      where: { userId: session.user.id, chatId: { in: targetChatIds } },
      select: { chatId: true },
    });
    const allowedChatIds = new Set(memberships.map((membership) => membership.chatId));
    if (allowedChatIds.size !== targetChatIds.length) {
      return Response.json({ error: "You can only forward to your chats" }, { status: 403 });
    }

    const forwarded = [];
    for (const targetChatId of targetChatIds) {
      const message = await prisma.message.create({
        data: {
          chatId: targetChatId,
          senderId: session.user.id,
          type: source.type,
          content: source.content,
          fileUrl: source.fileUrl,
          fileName: source.fileName,
          fileType: source.fileType,
          fileSize: source.fileSize,
          forwardedFromId: source.forwardedFromId ?? source.id,
          ...(source.linkPreview ? { linkPreview: source.linkPreview } : {}),
        },
        include: messageInclude,
      });
      forwarded.push(message);

      await notifySocket("new-message", message, { chatId: targetChatId });

      const members = await prisma.chatMember.findMany({
        where: { chatId: targetChatId },
        select: { userId: true },
      });
      await notifySocket(
        "chat-updated",
        { chatId: targetChatId, senderId: session.user.id },
        { userIds: members.map((member) => member.userId) }
      );
    }

    return Response.json({ messages: forwarded });
  } catch (error) {
    console.error("POST /api/message/[chatId]/forward error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
