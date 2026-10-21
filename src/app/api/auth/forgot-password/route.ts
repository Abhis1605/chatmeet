import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/resend";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const RESET_CODE_TTL_MS = 10 * 60 * 1000;

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));
  const normalizedEmail = typeof email === "string" ? email.trim() : "";

  if (!normalizedEmail) {
    return Response.json({ error: "Email required" });
  }

  // Stop email spam: 3 codes per email and 10 per IP every 15 minutes
  if (
    !rateLimit(`forgot-password:${normalizedEmail.toLowerCase()}`, 3, 15 * 60_000).ok ||
    !rateLimit(`forgot-password-ip:${getClientIp(req)}`, 10, 15 * 60_000).ok
  ) {
    return Response.json({
      error: "Too many reset requests. Please wait a few minutes and try again.",
    });
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, password: true },
  });

  // Only accounts that sign in with a password can reset one. Respond the
  // same way either way so this can't be used to discover who has an account.
  if (user?.password) {
    const otp = randomInt(100000, 1000000).toString();

    await prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpiry: new Date(Date.now() + RESET_CODE_TTL_MS) },
    });

    try {
      await sendPasswordResetEmail(normalizedEmail, otp);
    } catch (err) {
      console.error("Failed to send password reset email:", err);
      if (process.env.NODE_ENV !== "production") {
        console.log(`[DEV] Password reset code for ${normalizedEmail}: ${otp}`);
      } else {
        return Response.json({
          error: "Failed to send the reset email. Please try again later.",
        });
      }
    }
  }

  return Response.json({ success: true });
}
