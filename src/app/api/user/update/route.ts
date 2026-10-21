import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, image } = await req.json();

  // Always update the logged-in user; never trust an email/id from the body
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      image,
    },
  });

  return Response.json({ success: true });
}
