import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

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

export const sendRoomInviteEmail = async ({
  to,
  inviterName,
  roomName,
  inviteUrl,
}: {
  to: string;
  inviterName: string;
  roomName: string;
  inviteUrl: string;
}) => {
  const safeInviter = escapeHtml(inviterName);
  const safeRoom = escapeHtml(roomName);

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject: `${inviterName} invited you to ${roomName} on ChatMeet`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="margin: 0 0 12px;">ChatMeet</h2>
        <p><strong>${safeInviter}</strong> invited you to join the room <strong>${safeRoom}</strong>.</p>
        <p style="margin: 24px 0;">
          <a href="${inviteUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 9999px; font-weight: 600;">
            Join the room
          </a>
        </p>
        <p style="color: #6c706a; font-size: 13px;">
          This invite expires in 7 days. If you were not expecting it, you can ignore this email.
        </p>
        <p style="color: #6c706a; font-size: 12px; word-break: break-all;">${inviteUrl}</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send room invite email: ${error.message}`);
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