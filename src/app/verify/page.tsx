"use client";

import AuthCard from "@/components/AuthCard";
import OtpInput from "@/components/OtpInput";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function VerifyPage() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);

  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  useEffect(() => {
    if (timer === 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  console.log(otp, email)

  const handleVerify = async () => {
    setLoading(true);

    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, otp }),
    });

    const data = await res.json();

    if (data.error) {
      alert(data.error);
      setLoading(false);
    } else {
      window.location.href = "/login";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#0b1220] to-[#111827]">

      <AuthCard>

        {/* Logo */}
        <div className="text-center mb-6">
          <img src="/chatmeet-logo.png" className="mx-auto h-16 mb-2" alt="logo-png" />
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
            <p>Resend code in 00:{timer}</p>
          ) : (
            <button
              onClick={() => setTimer(60)}
              className="text-blue-400"
            >
              Resend Code
            </button>
          )}
        </div>

      </AuthCard>
    </div>
  );
}