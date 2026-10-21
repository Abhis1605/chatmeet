import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit, resetRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const { email, otp } = await req.json();

  if (!email || !otp) {
    return Response.json({ error: "Email and OTP required" });
  }

  // Stop OTP brute force: 5 guesses per email and 20 per IP every 15 minutes
  const emailKey = `verify-otp:${String(email).toLowerCase()}`;
  if (
    !rateLimit(emailKey, 5, 15 * 60_000).ok ||
    !rateLimit(`verify-otp-ip:${getClientIp(req)}`, 20, 15 * 60_000).ok
  ) {
    return Response.json({
      error: "Too many attempts. Please request a new code and try again later.",
    });
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return Response.json({ error: "User not found" });
  }

  if (user.otp !== otp) {
    return Response.json({ error: "Invalid OTP" });
  }


  if (!user.otpExpiry || user.otpExpiry < new Date()) {
    return Response.json({ error: "OTP expired" });
  }
  
  await prisma.user.update({
    where: { email },
    data: {
      emailVerified: true,
      otp: null,
      otpExpiry: null,
    },
  });

  resetRateLimit(emailKey);
  return Response.json({ success: true });
}