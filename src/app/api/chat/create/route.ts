import { prisma } from "@/lib/prisma";
import { publicUserSelect } from "@/lib/public-user";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // The creator is always the logged-in user, whatever the body says
    const userId = session.user.id;
    const { targetUserId } = await req.json();

    if (!targetUserId || typeof targetUserId !== "string") {
      return Response.json(
        { error: "Missing targetUserId" },
        { status: 400 }
      );
    }

    if (targetUserId === userId) {
      return Response.json(
        { error: "Cannot start a chat with yourself" },
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
            user: { select: publicUserSelect },
          },
        },
      },
    });

    if (existing) {
      return Response.json(existing);
    }

    // CREATE NEW CHAT
    try {
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
              user: { select: publicUserSelect },
            },
          },
        },
      });

      return Response.json(chat);
    } catch (dbError: any) {
      console.error("Prisma specific error:", dbError.code, dbError.meta);
      return Response.json(
        { error: "Could not create chat" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("API Error:", error);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
