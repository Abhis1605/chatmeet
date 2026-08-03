import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getRoomMember } from "@/lib/roomUtils";
import { NextResponse } from "next/server";

// DELETE /api/room/invite/:inviteId — cancel pending invite (inviter or room creator)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { inviteId } = await params;

    const invite = await prisma.roomInvite.findUnique({
      where: { id: inviteId },
      include: { chat: true },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    const currentMember = await getRoomMember(invite.chatId, session.user.id);
    const isInviter = invite.invitedById === session.user.id;
    const isCreator = currentMember?.role === "CREATOR";

    if (!isInviter && !isCreator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (invite.status !== "PENDING") {
      return NextResponse.json({ error: "Only pending invites can be cancelled" }, { status: 400 });
    }

    await prisma.roomInvite.delete({ where: { id: inviteId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/room/invite/[inviteId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
