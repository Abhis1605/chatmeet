import { prisma } from "@/lib/prisma";
import { notifySocket } from "@/lib/socket-notify";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

const FOREVER = new Date("9999-12-31T23:59:59.999Z");

// PATCH /api/chat/[chatId]/preferences — per-chat archive & mute.
// body: { archived?: boolean, muted?: boolean, mutedUntil?: string | null }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await params;
    const body = await req.json();

    const data: { archivedAt?: Date | null; mutedUntil?: Date | null } = {};

    if (typeof body.archived === "boolean") {
      data.archivedAt = body.archived ? new Date() : null;
    }

    if (typeof body.muted === "boolean") {
      if (body.muted) {
        const until = body.mutedUntil ? new Date(body.mutedUntil) : FOREVER;
        if (Number.isNaN(until.getTime())) {
          return Response.json({ error: "Invalid mutedUntil" }, { status: 400 });
        }
        data.mutedUntil = until;
      } else {
        data.mutedUntil = null;
      }
    }

    if (!Object.keys(data).length) {
      return Response.json({ error: "Nothing to update" }, { status: 400 });
    }

    const member = await prisma.chatMember.findFirst({
      where: { chatId, userId: session.user.id },
      select: { id: true },
    });
    if (!member) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.chatMember.update({
      where: { id: member.id },
      data,
      select: { archivedAt: true, mutedUntil: true },
    });

    await notifySocket(
      "chat-preferences-updated",
      {
        chatId,
        userId: session.user.id,
        archivedAt: updated.archivedAt?.toISOString() ?? null,
        mutedUntil: updated.mutedUntil?.toISOString() ?? null,
      },
      { userIds: [session.user.id] }
    );

    return Response.json({
      archivedAt: updated.archivedAt?.toISOString() ?? null,
      mutedUntil: updated.mutedUntil?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("PATCH /api/chat/[chatId]/preferences error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
