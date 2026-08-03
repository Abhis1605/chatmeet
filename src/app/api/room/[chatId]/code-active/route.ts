import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getRoomMember } from "@/lib/roomUtils";
import { NextResponse } from "next/server";

// PATCH /api/room/:chatId/code-active — { active: boolean } — creator only
export async function PATCH(
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

    if (!member || member.role !== "CREATOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const active = Boolean(body.active);

    const updated = await prisma.chat.update({
      where: { id: chatId },
      data: { roomCodeActive: active },
      select: { roomCodeActive: true },
    });

    return NextResponse.json({ roomCodeActive: updated.roomCodeActive });
  } catch (error) {
    console.error("PATCH /api/room/[chatId]/code-active error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
