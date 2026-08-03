import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getRoomMember } from "@/lib/roomUtils";
import { notifySocket } from "@/lib/socket-notify";
import { NextResponse } from "next/server";

// DELETE /api/room/:chatId — creator only
export async function DELETE(
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

    const members = await prisma.chatMember.findMany({
      where: { chatId },
      select: { userId: true },
    });
    const memberUserIds = members.map((m) => m.userId);

    await prisma.$transaction([
      prisma.message.deleteMany({ where: { chatId } }),
      prisma.roomInvite.deleteMany({ where: { chatId } }),
      prisma.chatMember.deleteMany({ where: { chatId } }),
      prisma.chat.delete({ where: { id: chatId } }),
    ]);

    await notifySocket("room-deleted", { chatId }, { userIds: memberUserIds });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/room/[chatId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
