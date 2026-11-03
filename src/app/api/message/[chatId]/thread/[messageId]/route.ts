import { prisma } from "@/lib/prisma";
import { messageInclude } from "@/lib/message-include";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth/[...nextauth]/route";


export async function GET(
  _req: Request,
  { params }: { params: Promise<{ chatId: string; messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId, messageId } = await params;

    const member = await prisma.chatMember.findFirst({
      where: { chatId, userId: session.user.id },
      select: { id: true },
    });
    if (!member) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const requested = await prisma.message.findFirst({
      where: { id: messageId, chatId },
      select: { id: true, parentId: true },
    });
    if (!requested) {
      return Response.json({ error: "Message not found" }, { status: 404 });
    }

    // Threads are one level deep: if the requested message is itself a reply,
    // load the thread it belongs to instead of returning an empty child thread.
    const rootId = requested.parentId ?? requested.id;

    const parent = await prisma.message.findFirst({
      where: { id: rootId, chatId },
      include: messageInclude,
    });
    if (!parent) {
      return Response.json({ error: "Message not found" }, { status: 404 });
    }

    const replies = await prisma.message.findMany({
      where: { chatId, parentId: parent.id },
      orderBy: { createdAt: "asc" },
      take: 200,
      include: messageInclude,
    });

    return Response.json({ parent, replies });
  } catch (error) {
    console.error("GET /api/message/[chatId]/thread/[messageId] error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
