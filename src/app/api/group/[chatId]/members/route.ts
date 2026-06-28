import {
  canManageGroup,
  GROUP_ROLES,
  type GroupRole,
} from "@/lib/groupPermissions";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

const getCurrentMember = (chatId: string, userId: string) =>
  prisma.chatMember.findFirst({
    where: {
      chatId,
      userId,
      chat: {
        isGroup: true,
      },
    },
  });

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

const getChat = (chatId: string) =>
  prisma.chat.findUnique({
    where: {
      id: chatId,
    },
    include: includeChat,
  });

const assertManager = async (chatId: string, userId: string) => {
  const member = await getCurrentMember(chatId, userId);
  return canManageGroup(member?.role);
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await params;

    if (!(await assertManager(chatId, session.user.id))) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const userId = String(body.userId ?? "");

    if (!userId) {
      return Response.json({ error: "User is required" }, { status: 400 });
    }

    await prisma.chatMember.upsert({
      where: {
        userId_chatId: {
          userId,
          chatId,
        },
      },
      create: {
        userId,
        chatId,
        role: GROUP_ROLES.MEMBER,
        canSend: false,
      },
      update: {},
    });

    return Response.json(await getChat(chatId));
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

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

    if (!(await assertManager(chatId, session.user.id))) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const memberId = String(body.memberId ?? "");
    const role = body.role as GroupRole | undefined;
    const canSend =
      typeof body.canSend === "boolean" ? Boolean(body.canSend) : undefined;

    if (!memberId) {
      return Response.json({ error: "Member is required" }, { status: 400 });
    }

    const existingMember = await prisma.chatMember.findFirst({
      where: {
        id: memberId,
        chatId,
      },
    });

    if (!existingMember) {
      return Response.json({ error: "Member not found" }, { status: 404 });
    }

    if (existingMember.role === GROUP_ROLES.CREATOR) {
      return Response.json(
        { error: "Creator permissions cannot be changed" },
        { status: 400 },
      );
    }

    const data: { role?: GroupRole; canSend?: boolean } = {};

    if (role === GROUP_ROLES.ADMIN || role === GROUP_ROLES.MEMBER) {
      data.role = role;
      data.canSend = role === GROUP_ROLES.ADMIN ? true : canSend ?? false;
    } else if (canSend !== undefined) {
      data.canSend = canSend;
    }

    await prisma.chatMember.update({
      where: {
        id: memberId,
      },
      data,
    });

    return Response.json(await getChat(chatId));
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

    if (!(await assertManager(chatId, session.user.id))) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return Response.json({ error: "Member is required" }, { status: 400 });
    }

    const member = await prisma.chatMember.findFirst({
      where: {
        id: memberId,
        chatId,
      },
    });

    if (!member) {
      return Response.json({ error: "Member not found" }, { status: 404 });
    }

    if (member.role === GROUP_ROLES.CREATOR) {
      return Response.json(
        { error: "Creator cannot be removed" },
        { status: 400 },
      );
    }

    await prisma.chatMember.delete({
      where: {
        id: memberId,
      },
    });

    return Response.json(await getChat(chatId));
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
