import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOTPEmail = async (to: string, otp: string) => {
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject: "ChatMeet OTP Verification",
    html: `
      <div style="font-family: sans-serif; text-align: center;">
        <h2>ChatMeet</h2>
        <p>Your verification code is:</p>
        <h1 style="letter-spacing: 5px;">${otp}</h1>
        <p>This code will expire in 60 seconds.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};