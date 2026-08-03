import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { notifySocket } from "@/lib/socket-notify";
import { NextResponse } from "next/server";

const MAX_ROOM_MEMBERS = 100;

// POST /api/room/invite/:inviteId/respond — { action: 'accept' | 'reject' }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { inviteId } = await params;
    const body = await req.json();
    const action = body.action as "accept" | "reject";

    if (action !== "accept" && action !== "reject") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const invite = await prisma.roomInvite.findUnique({
      where: { id: inviteId },
      include: { chat: { include: { members: true } } },
    });

    if (!invite || invite.invitedUserId !== session.user.id) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (invite.status !== "PENDING") {
      return NextResponse.json({ error: "Invite already responded to" }, { status: 409 });
    }

    if (action === "reject") {
      await prisma.roomInvite.update({
        where: { id: inviteId },
        data: { status: "REJECTED", respondedAt: new Date() },
      });
      return NextResponse.json({ success: true });
    }

    if (invite.chat.members.length >= MAX_ROOM_MEMBERS) {
      return NextResponse.json({ error: "This room is full" }, { status: 409 });
    }

    const alreadyMember = invite.chat.members.some((m) => m.userId === session.user!.id);
    if (alreadyMember) {
      await prisma.roomInvite.update({
        where: { id: inviteId },
        data: { status: "ACCEPTED", respondedAt: new Date() },
      });
      return NextResponse.json({ success: true });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.roomInvite.update({
        where: { id: inviteId },
        data: { status: "ACCEPTED", respondedAt: new Date() },
      });

      const member = await tx.chatMember.create({
        data: {
          chatId: invite.chatId,
          userId: session.user!.id,
          role: "MEMBER",
          canSend: true,
        },
        include: { user: true },
      });

      return member;
    });

    const memberUserIds = invite.chat.members.map((m) => m.userId);
    if (!memberUserIds.includes(session.user.id)) {
      memberUserIds.push(session.user.id);
    }

    await notifySocket(
      "room-member-joined",
      { chatId: invite.chatId, member: result },
      { chatId: invite.chatId, userIds: memberUserIds }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/room/invite/[inviteId]/respond error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
