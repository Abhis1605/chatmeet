"use client";

import { useState } from "react";

export default function VerifyPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const handleVerify = async () => {
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });

    const data = await res.json();

    if (data.error) alert(data.error);
    else {
      alert("Verified");
      window.location.href = "/login";
    }
  };

  return (
    <div>
      <h1>Verify OTP</h1>
      <input onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input onChange={(e) => setOtp(e.target.value)} placeholder="OTP" />
      <button onClick={handleVerify}>Verify</button>
    </div>
  );
}