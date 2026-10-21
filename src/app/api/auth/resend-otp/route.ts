import { prisma } from "@/lib/prisma";
import { sendOTPEmail } from "@/lib/resend";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email) {
    return Response.json({ error: "Email required" });
  }

  // Stop email spam: 3 resends per email and 10 per IP every 15 minutes
  if (
    !rateLimit(`resend-otp:${String(email).toLowerCase()}`, 3, 15 * 60_000).ok ||
    !rateLimit(`resend-otp-ip:${getClientIp(req)}`, 10, 15 * 60_000).ok
  ) {
    return Response.json({
      error: "Too many code requests. Please wait a few minutes and try again.",
    });
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