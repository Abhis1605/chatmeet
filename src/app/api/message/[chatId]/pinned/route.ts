import { prisma } from "@/lib/prisma";
import { messageInclude } from "@/lib/message-include";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

// GET /api/message/[chatId]/pinned — pinned messages for a chat.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await params;
    const member = await prisma.chatMember.findFirst({
      where: { chatId, userId: session.user.id },
      select: { id: true },
    });
    if (!member) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { chatId, pinnedAt: { not: null } },
      orderBy: { pinnedAt: "desc" },
      take: 100,
      include: messageInclude,
    });

    return Response.json({ messages });
  } catch (error) {
    console.error("GET /api/message/[chatId]/pinned error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
