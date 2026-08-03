import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { notifySocket } from "@/lib/socket-notify";
import { NextResponse } from "next/server";

const MAX_ROOM_MEMBERS = 100;

// POST /api/room/join — { roomCode }
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const roomCode = (body.roomCode as string)?.trim().toUpperCase();
    if (!roomCode) {
      return NextResponse.json({ error: "Room code is required" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const room = await tx.chat.findUnique({
        where: { roomCode },
        include: { members: { include: { user: true } } },
      });

      if (!room || !room.isRoom) {
        throw { code: "NOT_FOUND", message: "Invalid room code" };
      }
      if (!room.roomCodeActive) {
        throw { code: "CODE_INACTIVE", message: "This room code is no longer active" };
      }

      const alreadyMember = room.members.some((m) => m.userId === session.user!.id);
      if (alreadyMember) {
        throw { code: "ALREADY_MEMBER", message: "You are already a member of this room" };
      }

      if (room.members.length >= MAX_ROOM_MEMBERS) {
        throw { code: "ROOM_FULL", message: "This room is full" };
      }

      const member = await tx.chatMember.create({
        data: {
          chatId: room.id,
          userId: session.user!.id,
          role: "MEMBER",
          canSend: true,
        },
        include: { user: true },
      });

      const fullRoom = await tx.chat.findUnique({
        where: { id: room.id },
        include: { members: { include: { user: true } } },
      });

      return { room: fullRoom, member };
    });

    const memberUserIds = result.room!.members.map((m) => m.userId);
    await notifySocket(
      "room-member-joined",
      { chatId: result.room!.id, member: result.member },
      { chatId: result.room!.id, userIds: memberUserIds }
    );

    return NextResponse.json(result.room, { status: 200 });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err?.code === "NOT_FOUND") return NextResponse.json({ error: err.message }, { status: 404 });
    if (err?.code === "CODE_INACTIVE") return NextResponse.json({ error: err.message }, { status: 403 });
    if (err?.code === "ALREADY_MEMBER") return NextResponse.json({ error: err.message }, { status: 409 });
    if (err?.code === "ROOM_FULL") return NextResponse.json({ error: err.message }, { status: 409 });
    console.error("POST /api/room/join error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
