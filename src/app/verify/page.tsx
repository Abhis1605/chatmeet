"use client";

import AuthCard from "@/components/AuthCard";
import OtpInput from "@/components/OtpInput";
import { showError, showSuccess } from "@/lib/toast";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function VerifyPage() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);

  const router = useRouter()

  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  useEffect(() => {
    if (timer === 0) return;

    if (timer > 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  console.log(otp, email);

  const handleVerify = async () => {
    setLoading(true);

    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp }),
    });

    const data = await res.json();

    if (data.error) {
      showError(data.error);
      setLoading(false);
    } else {
      showSuccess('Email verified Successfully')
      router.push('/login')
    }
  };

  const handleResend = async () => {
    if (!email) {
      showError("Email missing");
      return;
    }

    setResendLoading(true);

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.error) {
        showError(data.error)
      } else {
        showSuccess('New OTP sent to your email')
        setTimer(60); // reset timer
      }
    } catch (error) {
      console.error(error);
      showError("Something went wrong");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#0b1220] to-[#111827]">
      <AuthCard>
        {/* Logo */}
        <div className="text-center mb-6">
          <img
            src="/chatmeet-logo.png"
            className="mx-auto h-16 mb-2"
            alt="logo-png"
          />
          <h1 className="text-2xl font-bold text-white">ChatMeet</h1>
          <p className="text-sm text-gray-400">
            Verify your identity to secure your account
          </p>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold text-white">
            Enter verification code
          </h2>
          <p className="text-sm text-gray-400">
            We sent a 6-digit code to your email
          </p>
        </div>

        {/* OTP Input */}
        <OtpInput onChange={setOtp} />

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={loading || otp.length < 6}
          className="btn-primary w-full mt-6 disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify Account →"}
        </button>

        {/* Resend */}
        <div className="text-center text-sm text-gray-400 mt-6">
          {timer > 0 ? (
            <p>Resend code in 00:{timer.toString().padStart(2, "0")}</p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="text-blue-400 disabled:opacity-50"
            >
              {resendLoading ? "Sending..." : "Resend Code"}
            </button>
          )}
        </div>
      </AuthCard>
    </div>
  );
}
