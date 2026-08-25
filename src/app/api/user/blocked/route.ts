import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const blocked = await prisma.blockedUser.findMany({
      where: { blockerId: session.user.id },
      select: {
        id: true,
        blockedId: true,
        createdAt: true,
        blocked: {
          select: { name: true, username: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const blockedUsers = blocked.map((b) => ({
      id: b.id,
      blockedId: b.blockedId,
      name: b.blocked.name,
      username: b.blocked.username,
      image: b.blocked.image,
      createdAt: b.createdAt,
    }));

    return Response.json({ blockedUsers });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
