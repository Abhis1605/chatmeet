import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { kickUserSockets } from "@/lib/session-revoke";

const INVALID_CODE = "Invalid or expired code";

export async function POST(req: Request) {
  const { email, otp, password } = await req.json().catch(() => ({}));
  const normalizedEmail = typeof email === "string" ? email.trim() : "";

  if (!normalizedEmail || typeof otp !== "string" || typeof password !== "string") {
    return Response.json({ error: "Email, code and new password are required" });
  }

  if (password.length < 8) {
    return Response.json({ error: "password must be 8+ chars" });
  }

  // Stop code brute force: 5 guesses per email and 20 per IP every 15 minutes
  const emailKey = `reset-password:${normalizedEmail.toLowerCase()}`;
  if (
    !rateLimit(emailKey, 5, 15 * 60_000).ok ||
    !rateLimit(`reset-password-ip:${getClientIp(req)}`, 20, 15 * 60_000).ok
  ) {
    return Response.json({
      error: "Too many attempts. Please request a new code and try again later.",
    });
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, password: true, otp: true, otpExpiry: true },
  });

  if (!user?.password || !user.otp || user.otp !== otp) {
    return Response.json({ error: INVALID_CODE });
  }

  if (!user.otpExpiry || user.otpExpiry < new Date()) {
    return Response.json({ error: INVALID_CODE });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: await bcrypt.hash(password, 10),
      otp: null,
      otpExpiry: null,
      // Receiving the code proves they own the email
      emailVerified: true,
      // Signs out every device that logged in before this reset
      passwordChangedAt: new Date(),
    },
  });

  await kickUserSockets(user.id);

  resetRateLimit(emailKey);
  return Response.json({ success: true });
}
