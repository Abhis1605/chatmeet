import { prisma } from "@/lib/prisma";
import { sendOTPEmail } from "@/lib/resend";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { randomInt } from "crypto";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email) {
    return Response.json({ error: "Email required" }, { status: 400 });
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

  if (!user || user.emailVerified) {
    return Response.json({ error: "Verification is unavailable for this account" }, { status: 404 });
  }

  const otp = randomInt(100000, 1000000).toString();

  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  try {
    await sendOTPEmail(email, otp);
  } catch (err) {
    console.error("Failed to send OTP email:", err);
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV] OTP for ${email}: ${otp}`);
    } else {
      return Response.json(
        { error: "Failed to send verification email. Please try again later." },
        { status: 503 }
      );
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { otp, otpExpiry },
  });

  return Response.json({ success: true });
}
