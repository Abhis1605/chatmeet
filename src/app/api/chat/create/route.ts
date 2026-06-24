import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, targetUserId } = body;

    if (!userId || !targetUserId) {
      return Response.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    // CHECK EXISTING CHAT
    const existing = await prisma.chat.findFirst({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: targetUserId } } },
        ],
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (existing) {
      return Response.json(existing);
    }

    // CREATE NEW CHAT
    const chat = await prisma.chat.create({
      data: {
        isGroup: false,
        members: {
          create: [
            { userId },
            { userId: targetUserId },
          ],
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    return Response.json(chat);

  } catch (error) {
    console.error("API Error:", error);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}