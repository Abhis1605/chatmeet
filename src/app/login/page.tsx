"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    await signIn("credentials", {
      email,
      password,
      callbackUrl: "/chat",
    });
  };

  return (
    <div>
      <h1>Login</h1>

      <input onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />

      <button onClick={handleLogin}>Login</button>

      <hr />

      <button onClick={() => signIn("google", { callbackUrl: "/chat" })}>
        Google
      </button>

      <button onClick={() => signIn("github", { callbackUrl: "/chat" })}>
        GitHub
      </button>
    </div>
  );
}
