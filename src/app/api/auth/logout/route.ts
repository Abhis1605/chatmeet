import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { sendOTPEmail } from "@/lib/resend";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      password: true,
      provider: true,
    },
  });

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const shouldIssueOtp = user.provider === "credentials" && Boolean(user.password);
  const otp = shouldIssueOtp
    ? Math.floor(100000 + Math.random() * 900000).toString()
    : null;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: false,
      otp,
      otpExpiry: shouldIssueOtp ? new Date(Date.now() + 60 * 1000) : null,
      isOnline: false,
      lastSeen: new Date(),
    },
  });

  if (shouldIssueOtp && otp) {
    try {
      await sendOTPEmail(user.email, otp);
    } catch (error) {
      console.error("Failed to send logout verification OTP", error);
    }
  }

  return Response.json({ success: true });
}
