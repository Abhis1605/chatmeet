"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { showSuccess } from "@/lib/toast";
import Model from "@/components/Modal";
import { useSession } from "next-auth/react";

export default function ChatClient({ session }: any) {
  const params = useSearchParams();
    const { update } = useSession()

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    if (params.get("login") === "success") {
      showSuccess("Logged in successfully");
    }
  }, []);

 useEffect(() => {
  if (!session.user?.name) {
    setOpen(true);
  } else {
    setOpen(false);
  }
}, [session]);

  const handleSave = async () => {
  const res = await fetch("/api/user/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: session.user.email,
      name,
    }),
  });

  const data = await res.json();

  if (data.success) {
    await update({
      ...session,
      user: {
        ...session.user,
        name,
      },
    });

    showSuccess("Profile updated");
    setOpen(false);
  }
};

  return (
    <>
      <h1 className="text-white">Welcome {session.user?.email}</h1>

      {/*  Profile Modal */}
      <Model isOpen={open} onClose={() => setOpen(false)}>
        <h2 className="text-white text-lg mb-4">Complete Your Profile</h2>

        <input
          placeholder="Enter your name"
          className="w-full p-2 rounded mb-4 text-black"
          onChange={(e) => setName(e.target.value)}
        />

        <button onClick={handleSave} className="btn-primary w-full">
          Save
        </button>
      </Model>
    </>
  );
}