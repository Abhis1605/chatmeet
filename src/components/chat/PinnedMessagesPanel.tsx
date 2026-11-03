"use client";

import { Pin, PinOff, X } from "lucide-react";
import Spinner from "@/components/Spinner";
import { usePinnedMessages } from "@/hooks/queries/use-pinned-messages";

interface PinnedMessagesPanelProps {
  open: boolean;
  chatId: string | null;
  onClose: () => void;
  onJumpToMessage: (messageId: string) => void;
  onUnpin: (message: any) => void;
  canPin?: boolean;
}

function messagePreview(message: any) {
  if (message.type === "IMAGE") return "Photo";
  if (message.type === "VIDEO") return "Video";
  if (message.type === "AUDIO") return "Voice message";
  if (message.type === "FILE") return message.fileName || "File";
  return message.content || "";
}

export default function PinnedMessagesPanel({
  open,
  chatId,
  onClose,
  onJumpToMessage,
  onUnpin,
  canPin = true,
}: PinnedMessagesPanelProps) {
  const { data: messages, isLoading, isError, refetch } = usePinnedMessages(
    chatId,
    open
  );

  if (!open || !chatId) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/40 sm:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="fixed inset-x-0 bottom-0 z-[101] flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-2xl border-t border-border bg-surface shadow-2xl sm:inset-y-0 sm:inset-x-auto sm:right-0 sm:max-h-none sm:w-[min(24rem,calc(100vw-1rem))] sm:rounded-none sm:rounded-l-2xl sm:border-l sm:border-t-0"
        aria-label="Pinned messages"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Pin size={16} className="text-primary" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Pinned messages
              </h2>
              <p className="text-xs text-muted">
                {messages?.length ?? 0}{" "}
                {(messages?.length ?? 0) === 1 ? "message" : "messages"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close pinned messages"
            className="rounded-md p-2 text-muted hover:bg-surface-soft hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {isLoading && (
            <div className="flex min-h-32 items-center justify-center">
              <Spinner />
            </div>
          )}

          {isError && (
            <div className="flex min-h-32 flex-col items-center justify-center gap-2 text-center">
              <p className="text-sm text-muted">Could not load pinned messages.</p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary-soft"
              >
                Try again
              </button>
            </div>
          )}

          {!isLoading && !isError && (messages?.length ?? 0) === 0 && (
            <div className="flex min-h-32 flex-col items-center justify-center gap-2 text-center text-muted">
              <Pin size={22} />
              <p className="text-sm">No pinned messages yet.</p>
              <p className="text-xs">
                Hover a message and tap the pin icon to keep it here.
              </p>
            </div>
          )}

          <div className="space-y-2">
            {messages?.map((message) => (
              <div
                key={message.id}
                className="rounded-xl border border-border bg-surface-soft p-3"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-semibold text-primary">
                    {message.sender?.name || message.sender?.email || "Unknown"}
                  </p>
                  <span className="shrink-0 text-[10px] text-muted">
                    {new Date(message.pinnedAt || message.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="line-clamp-3 whitespace-pre-wrap text-sm text-foreground">
                  {messagePreview(message)}
                </p>
                <div className="mt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onJumpToMessage(message.id)}
                    className="rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary-soft"
                  >
                    Jump
                  </button>
                  {canPin && (
                    <button
                      type="button"
                      onClick={() => onUnpin(message)}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-surface hover:text-error"
                    >
                      <PinOff size={12} />
                      Unpin
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
