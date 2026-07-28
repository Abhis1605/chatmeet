import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await params;

    await prisma.chatMember.update({
      where: {
        userId_chatId: {
          userId: session.user.id,
          chatId: chatId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
