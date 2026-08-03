"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { showError } from "@/lib/toast";
import { useCreateRoom } from "@/hooks/mutations/use-create-room";

interface CreateRoomModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateRoomModal({ open, onClose }: CreateRoomModalProps) {
  const [name, setName] = useState("");
  const { mutate: createRoom, isPending } = useCreateRoom();

  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  const handleCreate = () => {
    if (!name.trim()) {
      showError("Room name is required");
      return;
    }

    createRoom(name.trim(), {
      onSuccess: () => {
        setName("");
        onClose();
      },
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20">
      <div className="w-125 bg-[#111827] rounded-xl shadow-2xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <p className="text-white text-sm font-semibold">Create Room</p>
          <button
            type="button"
            title="Close"
            aria-label="Close"
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:bg-white/10 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Room name"
            className="w-full rounded-lg bg-white/5 px-4 py-3 text-white outline-none border border-white/10 focus:border-blue-500"
          />

          <button
            type="button"
            disabled={isPending}
            onClick={handleCreate}
            className="btn-primary w-full disabled:opacity-60"
          >
            {isPending ? "Creating..." : "Create Room"}
          </button>
        </div>
      </div>
    </div>
  );
}
