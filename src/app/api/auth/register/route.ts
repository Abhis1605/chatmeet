import { prisma } from "@/lib/prisma";
import { sendOTPEmail } from "@/lib/resend";
import bcrypt from "bcrypt";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { randomInt } from "crypto";

export async function POST(req: Request) {
  // 5 sign-ups per IP per hour
  if (!rateLimit(`register:${getClientIp(req)}`, 5, 60 * 60_000).ok) {
    return Response.json({
      error: "Too many sign-up attempts. Please try again later.",
    });
  }

  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return Response.json({
      error: "All fields required",
    }, { status: 400 });
  }

  if (password.length < 8) {
    return Response.json({ error: "password must be 8+ chars" }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return Response.json({ error: "Email already exists" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);

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

  // Create the account only after delivery succeeds (or after the development
  // fallback logs the code), so a production mail failure cannot reserve the
  // address as an unverified account.
  try {
    await prisma.user.create({
      data: {
        email,
        password: hashed,
        provider: "credentials",
        otp,
        otpExpiry,
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return Response.json({ error: "Email already exists" }, { status: 409 });
    }
    throw error;
  }

  return Response.json({
    success: true,
  }, { status: 201 });
}
