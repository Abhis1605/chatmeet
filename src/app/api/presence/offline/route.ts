import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { isOnline: false, lastSeen: new Date() },
      select: { id: true },
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("POST /api/presence/offline error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
