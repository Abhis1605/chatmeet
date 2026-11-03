"use client";

import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Bell,
  BellOff,
  Check,
  ChevronRight,
  MoreVertical,
  Pin,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useChatPreferences } from "@/hooks/mutations/use-chat-preferences";
import { showError } from "@/lib/toast";

const MUTE_OPTIONS = [
  { label: "1 hour", hours: 1 },
  { label: "8 hours", hours: 8 },
  { label: "24 hours", hours: 24 },
  { label: "1 week", hours: 24 * 7 },
];

const FOREVER_ISO = "9999-12-31T23:59:59.999Z";

interface ChatOptionsMenuProps {
  chatId: string;
  archivedAt?: string | null;
  mutedUntil?: string | null;
  onOpenSearch?: () => void;
  onOpenPinned?: () => void;
  pinnedCount?: number;
  onChanged?: () => void;
}

export default function ChatOptionsMenu({
  chatId,
  archivedAt,
  mutedUntil,
  onOpenSearch,
  onOpenPinned,
  pinnedCount,
  onChanged,
}: ChatOptionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [showMuteOptions, setShowMuteOptions] = useState(false);
  const { mutate: updatePreferences, isPending } = useChatPreferences(chatId);

  const isArchived = Boolean(archivedAt);
  const isMuted = Boolean(
    mutedUntil && new Date(mutedUntil).getTime() > Date.now()
  );

  const close = () => {
    setOpen(false);
    setShowMuteOptions(false);
  };

  const apply = (
    body: { archived?: boolean; muted?: boolean; mutedUntil?: string | null },
    successMessage: string
  ) => {
    updatePreferences(body, {
      onSuccess: () => {
        toast.success(successMessage);
        onChanged?.();
        close();
      },
      onError: () => showError("Could not update chat settings."),
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        title="Chat options"
        aria-label="Chat options"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="p-2 rounded-md text-muted hover:bg-surface-soft hover:text-foreground transition cursor-pointer"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={close}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-2xl">
            {onOpenSearch && (
              <button
                type="button"
                onClick={() => {
                  onOpenSearch();
                  close();
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground hover:bg-surface-soft"
              >
                <Search size={15} className="text-muted" />
                Search messages
              </button>
            )}

            {onOpenPinned && (
              <button
                type="button"
                onClick={() => {
                  onOpenPinned();
                  close();
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground hover:bg-surface-soft"
              >
                <Pin size={15} className="text-muted" />
                Pinned messages
                {(pinnedCount ?? 0) > 0 && (
                  <span className="ml-auto rounded-full bg-primary-soft px-1.5 text-[10px] font-semibold text-primary">
                    {pinnedCount}
                  </span>
                )}
              </button>
            )}

            <div className="my-1 h-px bg-border" />

            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                apply(
                  { archived: !isArchived },
                  isArchived ? "Chat unarchived" : "Chat archived"
                )
              }
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground hover:bg-surface-soft disabled:opacity-50"
            >
              {isArchived ? (
                <ArchiveRestore size={15} className="text-muted" />
              ) : (
                <Archive size={15} className="text-muted" />
              )}
              {isArchived ? "Unarchive chat" : "Archive chat"}
            </button>

            {isMuted ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() => apply({ muted: false }, "Notifications unmuted")}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground hover:bg-surface-soft disabled:opacity-50"
              >
                <Bell size={15} className="text-muted" />
                Unmute notifications
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowMuteOptions((value) => !value)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground hover:bg-surface-soft"
                >
                  <BellOff size={15} className="text-muted" />
                  Mute notifications
                  <ChevronRight
                    size={14}
                    className={`ml-auto text-muted transition ${
                      showMuteOptions ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {showMuteOptions && (
                  <div className="bg-surface-soft/60 py-1">
                    {MUTE_OPTIONS.map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          apply(
                            {
                              muted: true,
                              mutedUntil: new Date(
                                Date.now() + option.hours * 60 * 60 * 1000
                              ).toISOString(),
                            },
                            `Muted for ${option.label}`
                          )
                        }
                        className="flex w-full items-center px-9 py-1.5 text-left text-xs text-foreground hover:bg-surface-soft disabled:opacity-50"
                      >
                        {option.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        apply(
                          { muted: true, mutedUntil: FOREVER_ISO },
                          "Muted until you unmute"
                        )
                      }
                      className="flex w-full items-center gap-1.5 px-9 py-1.5 text-left text-xs text-foreground hover:bg-surface-soft disabled:opacity-50"
                    >
                      Until I unmute <Check size={11} className="text-muted" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
