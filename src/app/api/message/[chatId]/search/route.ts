import { prisma } from "@/lib/prisma";
import { publicUserSelect } from "@/lib/public-user";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

// GET /api/message/[chatId]/search?q=... — search messages in one chat.
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
    const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
    if (q.length < 2) {
      return Response.json({ messages: [] });
    }

    const member = await prisma.chatMember.findFirst({
      where: { chatId, userId: session.user.id },
      select: { id: true },
    });
    if (!member) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: {
        chatId,
        OR: [
          { content: { contains: q, mode: "insensitive" } },
          { fileName: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        content: true,
        type: true,
        fileName: true,
        senderId: true,
        createdAt: true,
        sender: { select: publicUserSelect },
      },
    });

    return Response.json({ messages });
  } catch (error) {
    console.error("GET /api/message/[chatId]/search error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
