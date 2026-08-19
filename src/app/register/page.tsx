"use client";

import AuthCard from "@/components/AuthCard";
import InputField from "@/components/InputField";
import { useRegister } from "@/hooks/mutations/use-register";
import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { mutate: register, isPending } = useRegister();

  const handleRegister = () => {
    if (!email || !password) return;
    register({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">

      <AuthCard>

        <div className="text-center mb-4">
          <div className="inline-block">
            <img src="/chatmeet-logo.png" className="h-30 w-60 object-contain" alt="ChatMeet logo" />
          </div>
          <p className="text-sm text-muted">
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

        <button
          className="btn-primary w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleRegister}
          disabled={isPending}
        >
          {isPending ? "Creating..." : "Create Account"}
        </button>

        <p className="text-center text-sm text-muted mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-primary">
            Login
          </Link>
        </p>

      </AuthCard>
    </div>
  );
}