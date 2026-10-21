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

export const sendPasswordResetEmail = async (to: string, otp: string) => {
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject: "Reset your ChatMeet password",
    html: `
      <div style="font-family: sans-serif; text-align: center;">
        <h2>ChatMeet</h2>
        <p>Use this code to reset your password:</p>
        <h1 style="letter-spacing: 5px;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
        <p style="color: #6c706a; font-size: 13px;">If you didn't ask to reset your password, you can ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

export const sendSupportEmail = async ({
  firstName,
  lastName,
  email,
  topic,
  message,
  phone,
}: {
  firstName: string;
  lastName: string;
  email: string;
  topic: string;
  message: string;
  phone?: string;
}) => {
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: process.env.EMAIL_FROM!,
    replyTo: email,
    subject: `ChatMeet contact: ${topic}`,
    text: [
      `From: ${firstName} ${lastName}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : "",
      `Topic: ${topic}`,
      "",
      message,
    ].filter(Boolean).join("\n"),
  });

  if (error) {
    throw new Error(`Failed to send support email: ${error.message}`);
  }
};