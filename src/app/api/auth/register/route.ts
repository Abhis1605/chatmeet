import { prisma } from "@/lib/prisma";
import { sendOTPEmail } from "@/lib/resend";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return Response.json({
      error: "All fields required",
    });
  }

  if (password.length < 8) {
    return Response.json({
      error: "password must be 8+ chars",
    });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return Response.json({
      error: "Email already exists",
    });
  }

  const hashed = await bcrypt.hash(password, 10);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const otpExpiry = new Date(Date.now() + 60 * 1000);

  await prisma.user.create({
    data: {
      email,
      password: hashed,
      provider: "credentials",
      otp,
      otpExpiry,
    },
  });

  console.log(otp)
  
  await sendOTPEmail(email, otp)

  return Response.json({
     success: true
  })
}
