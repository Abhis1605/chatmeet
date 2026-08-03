import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getRoomMember } from "@/lib/roomUtils";
import { notifySocket } from "@/lib/socket-notify";
import { NextResponse } from "next/server";

// POST /api/room/:chatId/leave
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

    if (!member) {
      return NextResponse.json({ error: "Not a member of this room" }, { status: 404 });
    }

    if (member.role === "CREATOR") {
      return NextResponse.json(
        { error: "Room creator must delete the room instead of leaving" },
        { status: 400 }
      );
    }

    const members = await prisma.chatMember.findMany({
      where: { chatId },
      select: { userId: true },
    });
    const memberUserIds = members.map((m) => m.userId);

    await prisma.chatMember.delete({ where: { id: member.id } });

    await notifySocket(
      "room-member-left",
      { chatId, userId: session.user.id },
      { chatId, userIds: memberUserIds }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/room/[chatId]/leave error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
