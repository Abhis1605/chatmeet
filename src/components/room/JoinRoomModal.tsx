"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { showError } from "@/lib/toast";
import { useJoinRoom } from "@/hooks/mutations/use-join-room";

interface JoinRoomModalProps {
  open: boolean;
  onClose: () => void;
}

export default function JoinRoomModal({ open, onClose }: JoinRoomModalProps) {
  const [code, setCode] = useState("");
  const { mutate: joinRoom, isPending } = useJoinRoom();

  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  const handleJoin = () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      showError("Enter a valid 6-character room code");
      return;
    }

    joinRoom(trimmed, {
      onSuccess: () => {
        setCode("");
        onClose();
      },
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20">
      <div className="w-125 bg-surface rounded-xl shadow-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-foreground text-sm font-semibold">Join Room</p>
          <button
            type="button"
            title="Close"
            aria-label="Close"
            onClick={onClose}
            className="p-1 rounded-md text-muted hover:bg-surface-soft hover:text-foreground transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="Enter 6-character code"
            className="w-full rounded-lg bg-surface-soft px-4 py-3 text-foreground tracking-widest text-center text-lg outline-none border border-border focus:border-primary uppercase"
          />

          <button
            type="button"
            disabled={isPending}
            onClick={handleJoin}
            className="btn-primary w-full disabled:opacity-60"
          >
            {isPending ? "Joining..." : "Join Room"}
          </button>
        </div>
      </div>
    </div>
  );
}
