import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// Account deletion is a SOFT delete: the user's messages and chat memberships
// are referenced by required, non-cascading foreign keys (Message.senderId,
// ChatMember.userId, CallSession.startedById, etc.), so a hard delete would
// either violate those constraints or silently erase chat history for other
// participants. Instead we anonymize the account in place (clear PII, mark
// deletedAt) and leave existing messages/chats attributed to the now-anonymized
// "Deleted User" row, matching how most chat apps handle this.
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { confirmation } = await req.json();
    if (confirmation !== "DELETE") {
      return Response.json({ error: 'Type "DELETE" to confirm' }, { status: 400 });
    }

    const userId = session.user.id;

    await prisma.$transaction([
      prisma.blockedUser.deleteMany({
        where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          name: "Deleted User",
          email: `deleted-${userId}@deleted.local`,
          password: null,
          image: null,
          username: null,
          bio: null,
          avatarFilename: null,
          profilePhotoType: "PHOTO",
          isOnline: false,
          otp: null,
          otpExpiry: null,
          resetToken: null,
          resetExpiry: null,
          deletedAt: new Date(),
        },
      }),
    ]);

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
