import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/room/invite/token/:token — details for the emailed invite link
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await params;

    const invite = await prisma.roomInvite.findUnique({
      where: { token },
      include: {
        chat: { select: { id: true, name: true, image: true } },
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

    const expired = Boolean(
      invite.expiresAt && invite.expiresAt.getTime() < Date.now()
    );

    return NextResponse.json({
      id: invite.id,
      status: invite.status === "PENDING" && expired ? "EXPIRED" : invite.status,
      expiresAt: invite.expiresAt?.toISOString() ?? null,
      chat: invite.chat,
      invitedBy: invite.invitedBy,
      invitedEmail: invite.invitedEmail,
    });
  } catch (error) {
    console.error("GET /api/room/invite/token/[token] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
