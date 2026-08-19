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

  try {
    await sendOTPEmail(email, otp)
  } catch (err) {
    console.error("Failed to send OTP email:", err)
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV] OTP for ${email}: ${otp}`)
    } else {
      return Response.json({
        error: "Failed to send verification email. Please try again later.",
      });
    }
  }

  return Response.json({ success: true });
}