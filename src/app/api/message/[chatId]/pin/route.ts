import { prisma } from "@/lib/prisma";
import { messageInclude } from "@/lib/message-include";
import { notifySocket } from "@/lib/socket-notify";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

// POST /api/message/[chatId]/pin — body: { messageId, pinned }
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
    const pinned = Boolean(body.pinned);

    if (!messageId) {
      return Response.json({ error: "messageId is required" }, { status: 400 });
    }

    const member = await prisma.chatMember.findFirst({
      where: { chatId, userId: session.user.id },
      select: { id: true },
    });
    if (!member) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const existing = await prisma.message.findFirst({
      where: { id: messageId, chatId },
      select: { id: true },
    });
    if (!existing) {
      return Response.json({ error: "Message not found" }, { status: 404 });
    }

    const message = await prisma.message.update({
      where: { id: messageId },
      data: {
        pinnedAt: pinned ? new Date() : null,
        pinnedById: pinned ? session.user.id : null,
      },
      include: messageInclude,
    });

    await notifySocket(
      "message-pinned",
      { message, chatId, pinned },
      { chatId }
    );

    return Response.json({ message });
  } catch (error) {
    console.error("POST /api/message/[chatId]/pin error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
