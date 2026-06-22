import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { email, otp } = await req.json();

  if (!email || !otp) {
    return Response.json({ error: "Email and OTP required" });
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

  return Response.json({ success: true });
}