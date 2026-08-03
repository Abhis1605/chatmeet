import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getRoomMember, uniqueRoomCode } from "@/lib/roomUtils";
import { NextResponse } from "next/server";

// POST /api/room/:chatId/regenerate-code — creator only
export async function POST(
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

    if (!member || member.role !== "CREATOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const roomCode = await uniqueRoomCode();

    await prisma.chat.update({
      where: { id: chatId },
      data: { roomCode, roomCodeActive: true },
    });

    return NextResponse.json({ roomCode });
  } catch (error) {
    console.error("POST /api/room/[chatId]/regenerate-code error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
