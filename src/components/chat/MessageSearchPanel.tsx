"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import Spinner from "@/components/Spinner";
import { useMessageSearch } from "@/hooks/queries/use-message-search";

interface MessageSearchPanelProps {
  open: boolean;
  chatId: string | null;
  onClose: () => void;
  onJumpToMessage: (messageId: string) => void;
}

function resultPreview(result: any) {
  if (result.type === "IMAGE") return "[Photo]";
  if (result.type === "VIDEO") return "[Video]";
  if (result.type === "AUDIO") return "[Voice message]";
  if (result.type === "FILE") return `[File] ${result.fileName ?? ""}`;
  return result.content ?? "";
}

export default function MessageSearchPanel({
  open,
  chatId,
  onClose,
  onJumpToMessage,
}: MessageSearchPanelProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: results, isFetching, isError } = useMessageSearch(chatId, query);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open || !chatId) return null;

  const trimmed = query.trim();

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/40 sm:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="fixed inset-x-0 bottom-0 z-[101] flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-2xl border-t border-border bg-surface shadow-2xl sm:inset-y-0 sm:inset-x-auto sm:right-0 sm:max-h-none sm:w-[min(26rem,calc(100vw-1rem))] sm:rounded-none sm:rounded-l-2xl sm:border-l sm:border-t-0"
        aria-label="Search messages"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Search messages</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="rounded-md p-2 text-muted hover:bg-surface-soft hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-border px-3 py-2">
          <div className="flex items-center gap-2 rounded-full border border-border bg-surface-soft px-3">
            <Search size={15} className="text-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search in this chat..."
              className="w-full bg-transparent py-2 text-sm text-foreground outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="rounded-full p-1 text-muted hover:text-foreground"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {trimmed.length < 2 && (
            <p className="p-6 text-center text-sm text-muted">
              Type at least 2 characters to search.
            </p>
          )}

          {trimmed.length >= 2 && isFetching && (
            <div className="flex min-h-24 items-center justify-center">
              <Spinner />
            </div>
          )}

          {trimmed.length >= 2 && isError && (
            <p className="p-6 text-center text-sm text-error">
              Could not search messages. Try again.
            </p>
          )}

          {trimmed.length >= 2 &&
            !isFetching &&
            !isError &&
            results?.length === 0 && (
              <p className="p-6 text-center text-sm text-muted">
                No messages match “{trimmed}”.
              </p>
            )}

          {trimmed.length >= 2 && (results?.length ?? 0) > 0 && (
            <div className="space-y-1">
              {results!.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => {
                    onJumpToMessage(result.id);
                    onClose();
                  }}
                  className="flex w-full flex-col gap-1 rounded-xl p-3 text-left transition hover:bg-surface-soft"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-primary">
                      {result.sender?.name || result.sender?.email || "Unknown"}
                    </p>
                    <span className="shrink-0 text-[10px] text-muted">
                      {new Date(result.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="line-clamp-2 whitespace-pre-wrap text-sm text-foreground">
                    {resultPreview(result)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
