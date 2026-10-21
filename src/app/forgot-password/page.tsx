"use client";

import AuthCard from "@/components/AuthCard";
import InputField from "@/components/InputField";
import OtpInput from "@/components/OtpInput";
import { showError, showSuccess } from "@/lib/toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const RESEND_SECONDS = 60;

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const requestCode = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      showError("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      const data = await postJson("/api/auth/forgot-password", { email: trimmedEmail });
      if (data.error) {
        showError(data.error);
        return;
      }
      showSuccess("If an account exists for that email, we've sent a reset code.");
      setStep("reset");
      setTimer(RESEND_SECONDS);
    } catch {
      showError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (password.length < 8) {
      showError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      showError("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const data = await postJson("/api/auth/reset-password", {
        email: email.trim(),
        otp,
        password,
      });
      if (data.error) {
        showError(data.error);
        return;
      }
      showSuccess("Password updated. Please sign in.");
      router.push("/login");
    } catch {
      showError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <AuthCard>
        {/* Logo */}
        <div className="text-center mb-3">
          <div className="inline-block">
            <img src="/chatmeet-logo.png" className="h-30 w-60 object-contain" alt="ChatMeet logo" />
          </div>
          <p className="text-sm text-muted">
            {step === "email"
              ? "Enter your email and we'll send you a reset code"
              : `Enter the 6-digit code sent to ${email.trim()}`}
          </p>
        </div>

        {step === "email" ? (
          <>
            <InputField
              label="Email Address"
              type="email"
              placeholder="Enter your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void requestCode();
              }}
              autoFocus
            />

            <button
              onClick={requestCode}
              disabled={loading}
              className="btn-primary w-full mt-6 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </>
        ) : (
          <>
            <OtpInput onChange={setOtp} />

            <div className="space-y-4 mt-6">
              <InputField
                label="New Password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <InputField
                label="Confirm New Password"
                type="password"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              onClick={resetPassword}
              disabled={loading || otp.length < 6}
              className="btn-primary w-full mt-6 disabled:opacity-50"
            >
              {loading ? "Updating..." : "Reset Password"}
            </button>

            <div className="text-center text-sm text-muted mt-6">
              {timer > 0 ? (
                <p>Resend code in 00:{timer.toString().padStart(2, "0")}</p>
              ) : (
                <button
                  onClick={requestCode}
                  disabled={loading}
                  className="text-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Resend Code
                </button>
              )}
            </div>

            <p className="text-center text-sm text-muted mt-3">
              <button
                type="button"
                onClick={() => {
                  setOtp("");
                  setStep("email");
                }}
                className="text-primary cursor-pointer"
              >
                Use a different email
              </button>
            </p>
          </>
        )}

        <p className="text-center text-sm text-muted mt-6">
          Remembered it?{" "}
          <Link href="/login" className="text-primary">
            Back to Sign In
          </Link>
        </p>
      </AuthCard>
    </div>
  );
}
