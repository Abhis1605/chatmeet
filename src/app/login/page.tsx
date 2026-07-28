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
    setLoadingProvider('credentials')
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if(res?.error){
      showError(res.error)
    }else {
      showSuccess('Logged in successfully')
      router.push('/chat')
    }

    setLoadingProvider(null)
  };

  const handleOAuth = async (provider: "google" | "github") => {
    setLoadingProvider(provider);

    const res = await signIn(provider, { callbackUrl: "/chat?login=success" });
  };

  return (

    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#0b1220] to-[#111827]">

      <AuthCard>

        {/* Logo */}
        <div className="text-center mb-6">
          <img src="/chatmeet-logo.png" className="mx-auto h-25 mb-1" alt="logo-png" />
          <h1 className="text-2xl font-bold text-white">ChatMeet</h1>
          <p className="text-sm text-(--color-text-muted)">
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
        <div className="my-6 text-center text-sm text-gray-500">
          OR CONTINUE WITH
        </div>

        {/* OAuth */}
        <div className=" flex gap-3">
          <button
            onClick={() => handleOAuth('google')}
            disabled={loadingProvider !== null }
            className="flex items-center justify-center flex-1 gap-2 py-3 rounded-lg border border-gray-600 text-white hover:bg-gray-800"
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
            className="flex items-center justify-center gap-2 flex-1 py-3 rounded-lg border border-gray-600 text-white hover:bg-gray-800"
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
        <p className="text-center text-sm text-gray-400 mt-6">
          Don’t have an account?{" "}
          <Link href="/register" className="text-blue-400">
            Create Account
          </Link>
        </p>

      </AuthCard>
    </div>
  );
}