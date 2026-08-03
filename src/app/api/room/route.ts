import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { roomInclude, uniqueRoomCode } from "@/lib/roomUtils";
import { NextResponse } from "next/server";

// POST /api/room — { name }
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const name = (body.name as string)?.trim();
    if (!name) {
      return NextResponse.json({ error: "Room name is required" }, { status: 400 });
    }

    const roomCode = await uniqueRoomCode();

    const room = await prisma.chat.create({
      data: {
        name,
        isGroup: false,
        isRoom: true,
        roomCode,
        roomCodeActive: true,
        members: {
          create: {
            userId: session.user.id,
            role: "CREATOR",
            canSend: true,
          },
        },
      },
      include: roomInclude,
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error("POST /api/room error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
