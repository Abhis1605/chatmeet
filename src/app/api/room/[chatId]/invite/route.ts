import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getRoomMember } from "@/lib/roomUtils";
import { notifySocket } from "@/lib/socket-notify";
import { NextResponse } from "next/server";

// POST /api/room/:chatId/invite — { invitedUserId }
export async function POST(
  req: Request,
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

    const body = await req.json();
    const invitedUserId = String(body.invitedUserId ?? "").trim();

    if (!invitedUserId) {
      return NextResponse.json({ error: "User is required" }, { status: 400 });
    }

    if (invitedUserId === session.user.id) {
      return NextResponse.json({ error: "You cannot invite yourself" }, { status: 400 });
    }

    const invitedUser = await prisma.user.findUnique({ where: { id: invitedUserId } });
    if (!invitedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingMember = await prisma.chatMember.findFirst({
      where: { chatId, userId: invitedUserId },
    });
    if (existingMember) {
      return NextResponse.json({ error: "User is already a member" }, { status: 409 });
    }

    const pendingInvite = await prisma.roomInvite.findFirst({
      where: { chatId, invitedUserId, status: "PENDING" },
    });
    if (pendingInvite) {
      return NextResponse.json({ error: "Invite already pending" }, { status: 409 });
    }

    const invite = await prisma.roomInvite.create({
      data: {
        chatId,
        invitedById: session.user.id,
        invitedUserId,
      },
      include: {
        chat: { select: { id: true, name: true } },
        invitedBy: { select: { id: true, name: true, image: true, email: true } },
      },
    });

    await notifySocket(
      "room-invite-received",
      { invite },
      { userIds: [invitedUserId] }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/room/[chatId]/invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
