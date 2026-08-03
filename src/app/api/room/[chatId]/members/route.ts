import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getRoomMember } from "@/lib/roomUtils";
import { NextResponse } from "next/server";

// GET /api/room/:chatId/members
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await params;
    const member = await getRoomMember(chatId, session.user.id);

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const members = await prisma.chatMember.findMany({
      where: { chatId },
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("GET /api/room/[chatId]/members error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
