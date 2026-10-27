import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { notifySocket } from "@/lib/socket-notify";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  // Presence is derived from active socket connections. Let the socket server
  // recalculate after the client disconnects instead of marking a live socket offline.
  await notifySocket("presence-refresh", {}, { userIds: [user.id] });

  return Response.json({ success: true });
}
