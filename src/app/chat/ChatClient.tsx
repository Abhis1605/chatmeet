// src/app/chat/ChatClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { showSuccess } from "@/lib/toast";
import Modal from "@/components/Modal"; // Ensure import matches file name
import { useSession } from "next-auth/react";

export default function ChatClient() {
  const { data: session, update, status } = useSession(); // Destructure status
  const params = useSearchParams();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    // Only trigger modal logic once authentication is confirmed
    if (status === "authenticated" && !session?.user?.name) {
      setOpen(true);
    } else if (status === "authenticated" && session?.user?.name) {
      setOpen(false);
    }
  }, [session, status]); // Added status to dependencies

  const handleSave = async () => {
    if (!name.trim()) return;

    const res = await fetch("/api/user/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: session?.user?.email,
        name,
      }),
    });

    const data = await res.json();

    if (data.success) {
      // update() triggers the jwt callback with trigger: "update"
      await update({
        user: {
          ...session?.user,
          name,
        },
      });

      showSuccess("Profile updated");
      setOpen(false);
    }
  };

  if (status === "loading") return <div className="text-white">Loading...</div>;

  return (
    <>
      <h1 className="text-white">Welcome {session?.user?.email}</h1>

      <Modal isOpen={open} onClose={() => setOpen(false)}>
        <h2 className="text-white text-lg mb-4">Complete Your Profile</h2>
        <input
          placeholder="Enter your name"
          value={name}
          className="w-full p-2 rounded mb-4 text-black"
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={handleSave} className="bg-blue-600 p-2 rounded w-full text-white">
          Save
        </button>
      </Modal>
    </>
  );
}