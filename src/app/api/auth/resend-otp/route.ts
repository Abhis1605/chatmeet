import { prisma } from "@/lib/prisma";
import { sendOTPEmail } from "@/lib/resend";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email) {
    return Response.json({ error: "Email required" });
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return Response.json({ error: "User not found" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const otpExpiry = new Date(Date.now() + 60 * 1000);

  await prisma.user.update({
    where: { email },
    data: {
      otp,
      otpExpiry,
    },
  });

  console.log(otp)

  await sendOTPEmail(email, otp)

  return Response.json({ success: true });
}