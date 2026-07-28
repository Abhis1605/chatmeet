"use client";

import AuthCard from "@/components/AuthCard";
import OtpInput from "@/components/OtpInput";
import { useVerifyOtp } from "@/hooks/mutations/use-verify-otp";
import { useResendOtp } from "@/hooks/mutations/use-resend-otp";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";


export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#0b1220] to-[#111827] text-white">Loading...</div>}>
      <VerifyPageContent />
    </Suspense>
  );
}

function VerifyPageContent() {
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(60);

  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const { mutate: verifyOtp, isPending: isVerifying } = useVerifyOtp();
  const { mutate: resendOtp, isPending: isResending } = useResendOtp();

  useEffect(() => {
    if (timer === 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = () => {
    verifyOtp({ email, otp });
  };

  const handleResend = () => {
    if (!email) return;
    resendOtp(
      { email },
      {
        onSuccess: (data) => {
          if (!data.error) {
            setTimer(60); // reset timer on successful resend
          }
        },
      }
    );
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
          disabled={isVerifying || otp.length < 6}
          className="btn-primary w-full mt-6 disabled:opacity-50"
        >
          {isVerifying ? "Verifying..." : "Verify Account →"}
        </button>

        {/* Resend */}
        <div className="text-center text-sm text-gray-400 mt-6">
          {timer > 0 ? (
            <p>Resend code in 00:{timer.toString().padStart(2, "0")}</p>
          ) : (
            <button
              onClick={handleResend}
              disabled={isResending}
              className="text-blue-400 disabled:opacity-50"
            >
              {isResending ? "Sending..." : "Resend Code"}
            </button>
          )}
        </div>
      </AuthCard>
    </div>
  );
}

