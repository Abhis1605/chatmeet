import { canDeleteGroup, canManageGroup } from "@/lib/groupPermissions";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { notifySocket } from "@/lib/socket-notify";

const includeChat = {
  members: {
    include: {
      user: true,
    },
  },
  messages: {
    take: 1,
    orderBy: {
      createdAt: "desc" as const,
    },
  },
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await params;
    const currentMember = await prisma.chatMember.findFirst({
      where: { chatId, userId: session.user.id, chat: { isGroup: true } },
    });

    if (!canManageGroup(currentMember?.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data: { name?: string; image?: string } = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) {
        return Response.json({ error: "Group name cannot be empty" }, { status: 400 });
      }
      data.name = name;
    }

    if (body.image !== undefined) {
      data.image = String(body.image);
    }

    const updated = await prisma.chat.update({
      where: { id: chatId },
      data,
      include: includeChat,
    });

    const memberUserIds = updated.members.map((m) => m.userId);
    await notifySocket("chat-updated", { chatId }, { userIds: memberUserIds });

    return Response.json(updated);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await params;
    const currentMember = await prisma.chatMember.findFirst({
      where: {
        chatId,
        userId: session.user.id,
        chat: {
          isGroup: true,
        },
      },
    });

    if (!canDeleteGroup(currentMember?.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.$transaction([
      prisma.message.deleteMany({
        where: {
          chatId,
        },
      }),
      prisma.chatMember.deleteMany({
        where: {
          chatId,
        },
      }),
      prisma.chat.delete({
        where: {
          id: chatId,
        },
      }),
    ]);

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
