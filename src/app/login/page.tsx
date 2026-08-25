"use client";

import AuthCard from "@/components/AuthCard";
import InputField from "@/components/InputField";
import { showError, showSuccess } from "@/lib/toast";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/store/auth-store";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { loadingProvider, setLoadingProvider } = useAuthStore();

  const router = useRouter()

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    setLoadingProvider('credentials')
    try {
      const res = await signIn("credentials", {
        email: trimmedEmail,
        password,
        redirect: false,
      });

      if(res?.error){
        showError(res.error)

        if (res.error === "Verify email first" && trimmedEmail) {
          router.push(`/verify?email=${encodeURIComponent(trimmedEmail)}`);
        }
      }else {
        showSuccess('Logged in successfully')
        router.push('/chat')
      }
    } finally {
      setLoadingProvider(null)
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    setLoadingProvider(provider);

    const res = await signIn(provider, { callbackUrl: "/chat?login=success" });
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
            Sign in to connect and start chatting
          </p>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <InputField
            label="Email Address"
            type="email"
            placeholder="Enter your Email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <InputField
            label="Password"
            type="password"
            placeholder="Enter your Password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Button */}
        <button
          onClick={handleLogin}
          disabled={ loadingProvider !== null }
          className="btn-primary w-full mt-6"
        >
          { loadingProvider === 'credentials' ? (
            <span className="flex justify-center items-center gap-2">
              <span className="animate-spin h-4 h-4 w-4 border-2 border-white border-t-transparent rounded-full">
              </span>
              Signing in...
            </span>
          ) : (
            'Sign In'
          )}
        </button>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3 text-sm text-muted">
          <div className="h-px flex-1 bg-border" />
          OR CONTINUE WITH
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* OAuth */}
        <div className=" flex gap-3">
          <button
            onClick={() => handleOAuth('google')}
            disabled={loadingProvider !== null }
            className="flex items-center justify-center flex-1 gap-2 py-3 rounded-lg border border-border text-foreground hover:bg-surface-soft cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingProvider === "google" ? (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              <>
                <Image
                  src="/google.png"
                  width={18}
                  height={18}
                  alt="google"
                />
                <span>Google</span>
              </>
            )}
          </button>

          <button
            onClick={() => handleOAuth('github')}
            className="flex items-center justify-center gap-2 flex-1 py-3 rounded-lg border border-border text-foreground hover:bg-surface-soft cursor-pointer"
          >
             {loadingProvider === "github" ? (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              <>
                <Image
                  src="/github.png"
                  width={18}
                  height={18}
                  alt="github"
                />
                <span>GitHub</span>
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted mt-6">
          Don’t have an account?{" "}
          <Link href="/register" className="text-primary">
            Create Account
          </Link>
        </p>

      </AuthCard>
    </div>
  );
}
