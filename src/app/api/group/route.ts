import { prisma } from "@/lib/prisma";
import { GROUP_ROLES } from "@/lib/groupPermissions";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const uniqueIds = (ids: string[]) => Array.from(new Set(ids.filter(Boolean)));

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const memberIds = uniqueIds(body.memberIds ?? []).filter(
      (id) => id !== session.user.id,
    );

    if (!name) {
      return Response.json({ error: "Group name is required" }, { status: 400 });
    }

    const chat = await prisma.chat.create({
      data: {
        name,
        isGroup: true,
        members: {
          create: [
            {
              userId: session.user.id,
              role: GROUP_ROLES.CREATOR,
              canSend: true,
            },
            ...memberIds.map((userId) => ({
              userId,
              role: GROUP_ROLES.MEMBER,
              canSend: false,
            })),
          ],
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return Response.json(chat);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
