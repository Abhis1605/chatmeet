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

    const invites = await prisma.roomInvite.findMany({
      where: {
        invitedUserId: session.user.id,
        status: "PENDING",
      },
      include: {
        chat: { select: { id: true, name: true } },
        invitedBy: { select: { id: true, name: true, image: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invites);
  } catch (error) {
    console.error("GET /api/invites/pending error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
