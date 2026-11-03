import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { publicUserSelect } from "@/lib/public-user";
import { notifySocket } from "@/lib/socket-notify";
import { NextResponse } from "next/server";

const MAX_ROOM_MEMBERS = 100;

// POST /api/room/invite/token/:token/respond — { action: 'accept' | 'reject' }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await params;
    const body = await req.json();
    const action = body.action as "accept" | "reject";

    if (action !== "accept" && action !== "reject") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const invite = await prisma.roomInvite.findUnique({
      where: { token },
      include: { chat: { include: { members: true } } },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    const sessionEmail = session.user.email?.toLowerCase();
    const emailMatches =
      Boolean(sessionEmail) &&
      invite.invitedEmail?.toLowerCase() === sessionEmail;

    if (invite.invitedUserId !== session.user.id && !emailMatches) {
      return NextResponse.json(
        { error: "This invite was sent to a different email address." },
        { status: 403 }
      );
    }

    if (invite.status !== "PENDING") {
      return NextResponse.json(
        { error: "Invite already responded to" },
        { status: 409 }
      );
    }

    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "This invite has expired" }, { status: 410 });
    }

    if (action === "reject") {
      await prisma.roomInvite.update({
        where: { id: invite.id },
        data: {
          status: "REJECTED",
          respondedAt: new Date(),
          invitedUserId: invite.invitedUserId ?? session.user.id,
        },
      });
      return NextResponse.json({ success: true, chatId: invite.chatId });
    }

    if (invite.chat.members.length >= MAX_ROOM_MEMBERS) {
      return NextResponse.json({ error: "This room is full" }, { status: 409 });
    }

    const alreadyMember = invite.chat.members.some(
      (member) => member.userId === session.user.id
    );

    if (alreadyMember) {
      await prisma.roomInvite.update({
        where: { id: invite.id },
        data: {
          status: "ACCEPTED",
          respondedAt: new Date(),
          invitedUserId: session.user.id,
        },
      });
      return NextResponse.json({ success: true, chatId: invite.chatId });
    }

    const member = await prisma.$transaction(async (tx) => {
      await tx.roomInvite.update({
        where: { id: invite.id },
        data: {
          status: "ACCEPTED",
          respondedAt: new Date(),
          invitedUserId: session.user.id,
        },
      });

      return tx.chatMember.create({
        data: {
          chatId: invite.chatId,
          userId: session.user.id,
          role: "MEMBER",
          canSend: true,
        },
        include: { user: { select: publicUserSelect } },
      });
    });

    const memberUserIds = invite.chat.members.map((m) => m.userId);
    if (!memberUserIds.includes(session.user.id)) {
      memberUserIds.push(session.user.id);
    }

    await notifySocket(
      "room-member-joined",
      { chatId: invite.chatId, member },
      { chatId: invite.chatId, userIds: memberUserIds }
    );

    return NextResponse.json({ success: true, chatId: invite.chatId });
  } catch (error) {
    console.error("POST /api/room/invite/token/[token]/respond error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
