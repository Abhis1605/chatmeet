"use client";

import { useEffect } from "react";
import { Copy, RefreshCw, X } from "lucide-react";
import type { RoomDto } from "@/types/dto/room.dto";
import { showInfo, showSuccess } from "@/lib/toast";
import { useRegenerateCode } from "@/hooks/mutations/use-regenerate-code";
import { useToggleCodeActive } from "@/hooks/mutations/use-toggle-code-active";

interface RoomCodeShareSheetProps {
  open: boolean;
  onClose: () => void;
  room: RoomDto;
  isCreator: boolean;
}

export default function RoomCodeShareSheet({
  open,
  onClose,
  room,
  isCreator,
}: RoomCodeShareSheetProps) {
  const { mutate: regenerate, isPending: regenerating } = useRegenerateCode();
  const { mutate: toggleActive, isPending: toggling } = useToggleCodeActive();

  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  const copyCode = async () => {
    if (!room.roomCode) return;
    await navigator.clipboard.writeText(room.roomCode);
    showSuccess("Room code copied");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20">
      <div className="w-125 bg-surface rounded-xl shadow-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-foreground text-sm font-semibold">Share Room Code</p>
          <button
            type="button"
            title="Close"
            aria-label="Close"
            onClick={onClose}
            className="p-1 rounded-md text-muted hover:bg-surface-soft hover:text-foreground transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="rounded-lg bg-surface-soft border border-border p-4 text-center">
            <p className="text-xs text-muted mb-2">Room code</p>
            <p className="text-2xl font-bold tracking-[0.3em] text-foreground">
              {room.roomCode ?? "------"}
            </p>
            {!room.roomCodeActive && (
              <p className="text-xs text-amber-400 mt-2">Code is currently disabled</p>
            )}
          </div>

          <button
            type="button"
            onClick={copyCode}
            disabled={!room.roomCode}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Copy className="w-4 h-4" />
            Copy Code
          </button>

          {isCreator && (
            <>
              <label className="flex items-center justify-between rounded-lg bg-surface-soft border border-border px-4 py-3">
                <span className="text-sm text-foreground">Allow joining via code</span>
                <input
                  type="checkbox"
                  checked={room.roomCodeActive}
                  disabled={toggling}
                  onChange={(e) =>
                    toggleActive({ chatId: room.id, active: e.target.checked })
                  }
                  className="h-4 w-4 accent-primary"
                />
              </label>

              <button
                type="button"
                disabled={regenerating}
                onClick={() => {
                  regenerate(room.id);
                  showInfo("Generating a new room code...");
                }}
                className="w-full rounded-lg border border-border bg-surface-soft px-4 py-2.5 text-sm text-foreground hover:bg-surface-soft/70 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {regenerating ? "Regenerating..." : "Regenerate Code"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
