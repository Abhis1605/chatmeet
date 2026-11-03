import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getRoomMember } from "@/lib/roomUtils";
import { notifySocket } from "@/lib/socket-notify";
import { sendRoomInviteEmail } from "@/lib/resend";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// POST /api/room/:chatId/invite — { invitedUserId?, email? }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!rateLimit(`room-invite:${session.user.id}`, 20, 60_000).ok) {
      return NextResponse.json(
        { error: "Too many invites. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    const { chatId } = await params;
    const member = await getRoomMember(chatId, session.user.id);

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const invitedUserId = String(body.invitedUserId ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!invitedUserId && !email) {
      return NextResponse.json(
        { error: "A user or email address is required" },
        { status: 400 }
      );
    }

    if (email && !EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { error: "Enter a valid email address" },
        { status: 400 }
      );
    }

    const invitedUser = invitedUserId
      ? await prisma.user.findUnique({ where: { id: invitedUserId } })
      : await prisma.user.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
        });

    if (invitedUserId && !invitedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetUserId = invitedUser?.id ?? null;
    const targetEmail = email || invitedUser?.email?.toLowerCase() || null;

    if (targetUserId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot invite yourself" },
        { status: 400 }
      );
    }

    if (targetUserId) {
      const existingMember = await prisma.chatMember.findFirst({
        where: { chatId, userId: targetUserId },
        select: { id: true },
      });
      if (existingMember) {
        return NextResponse.json(
          { error: "User is already a member" },
          { status: 409 }
        );
      }
    }

    const pendingInvite = await prisma.roomInvite.findFirst({
      where: {
        chatId,
        status: "PENDING",
        ...(targetUserId
          ? { invitedUserId: targetUserId }
          : { invitedEmail: targetEmail }),
      },
      select: { id: true },
    });
    if (pendingInvite) {
      return NextResponse.json(
        { error: "Invite already pending" },
        { status: 409 }
      );
    }

    const invite = await prisma.roomInvite.create({
      data: {
        chatId,
        invitedById: session.user.id,
        invitedUserId: targetUserId,
        invitedEmail: targetEmail,
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      },
      include: {
        chat: { select: { id: true, name: true } },
        invitedBy: {
          select: {
            id: true,
            name: true,
            image: true,
            profilePhotoType: true,
            avatarFilename: true,
            email: true,
          },
        },
      },
    });

    if (targetUserId) {
      await notifySocket(
        "room-invite-received",
        { invite },
        { userIds: [targetUserId] }
      );
    }

    let emailSent = false;
    if (email) {
      const baseUrl = process.env.NEXTAUTH_URL ?? new URL(req.url).origin;
      try {
        await sendRoomInviteEmail({
          to: email,
          inviterName:
            session.user.name || session.user.email || "A ChatMeet user",
          roomName: invite.chat.name || "a room",
          inviteUrl: `${baseUrl}/invite/${invite.token}`,
        });
        emailSent = true;
      } catch (error) {
        console.error("Failed to send room invite email:", error);
      }
    }

    return NextResponse.json({
      success: true,
      emailSent,
      inviteId: invite.id,
      ...(email && !emailSent
        ? { warning: "Invite created, but the email could not be sent." }
        : {}),
    });
  } catch (error) {
    console.error("POST /api/room/[chatId]/invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
