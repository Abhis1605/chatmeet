"use client";


import AuthCard from "@/components/AuthCard";
import InputField from "@/components/InputField";
import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data.error) alert(data.error);
    else window.location.href = "/verify";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#0b1220] to-[#111827]">

      <AuthCard>

        <div className="text-center mb-6">
          <img src="/chatmeet-logo.png" className="mx-auto h-12 mb-2" alt="logo-png" />
          <h1 className="text-2xl font-bold text-white">ChatMeet</h1>
          <p className="text-sm text-gray-400">
            Create your account
          </p>
        </div>

        <div className="space-y-4">
          <InputField
            label="Email Address"
            type="email"
            placeholder="Enter your E-mail Address"
            onChange={(e) => setEmail(e.target.value)}
          />

          <InputField
            label="Password"
            type="password"
            placeholder="Enter your Password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="btn-primary w-full mt-6" onClick={handleRegister}>
          Create Account
        </button>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-blue-400">
            Login
          </a>
        </p>

      </AuthCard>
    </div>
  );
}