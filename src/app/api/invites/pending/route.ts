import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/invites/pending
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Invites sent to this email before the user signed up have no user id
    // yet. Link them on first load so they show up in the in-app list.
    if (session.user.email) {
      const emailInvites = await prisma.roomInvite.findMany({
        where: {
          invitedUserId: null,
          invitedEmail: {
            equals: session.user.email,
            mode: "insensitive",
          },
          status: "PENDING",
        },
        select: { id: true, chatId: true },
      });

      for (const emailInvite of emailInvites) {
        const alreadyLinked = await prisma.roomInvite.findFirst({
          where: {
            chatId: emailInvite.chatId,
            invitedUserId: session.user.id,
            status: "PENDING",
          },
          select: { id: true },
        });
        if (alreadyLinked) continue;

        try {
          await prisma.roomInvite.update({
            where: { id: emailInvite.id },
            data: { invitedUserId: session.user.id },
          });
        } catch (error) {
          console.error("Failed to link email invite:", error);
        }
      }
    }

    const now = new Date();
    const invites = await prisma.roomInvite.findMany({
      where: {
        invitedUserId: session.user.id,
        status: "PENDING",
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invites);
  } catch (error) {
    console.error("GET /api/invites/pending error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
