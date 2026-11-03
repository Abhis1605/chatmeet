"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useThread } from "@/hooks/queries/use-thread";
import { useSendMessage } from "@/hooks/mutations/use-send-message";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import Spinner from "@/components/Spinner";

interface ThreadPanelProps {
  chatId: string;
  messageId: string;
  session: any;
  isGroup?: boolean;
  disabled?: boolean;
  onClose: () => void;
  onReact?: (message: any, emoji: string) => void;
  onPin?: (message: any) => void;
}

export default function ThreadPanel({
  chatId,
  messageId,
  session,
  isGroup = false,
  disabled = false,
  onClose,
  onReact,
  onPin,
}: ThreadPanelProps) {
  const { data: thread, isLoading, isError, refetch } = useThread(chatId, messageId);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.replies.length]);

  const handleSend = () => {
    const content = input.trim();
    if (!content || disabled || isSending) return;

    sendMessage({
      chatId,
      type: "TEXT",
      content,
      parentId: thread?.parent.id ?? messageId,
    });
    setInput("");
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/40 sm:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="fixed inset-x-0 bottom-0 z-[101] flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border-t border-border bg-surface shadow-2xl sm:inset-y-0 sm:inset-x-auto sm:right-0 sm:max-h-none sm:w-[min(28rem,calc(100vw-1rem))] sm:rounded-none sm:rounded-l-2xl sm:border-l sm:border-t-0"
        aria-label="Message thread"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">Thread</h2>
            <p className="text-xs text-muted">
              {isLoading
                ? "Loading..."
                : thread
                  ? `${thread.replies.length} ${thread.replies.length === 1 ? "reply" : "replies"}`
                  : "Unable to load"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close thread"
            title="Close thread"
            className="rounded-md p-2 text-muted hover:bg-surface-soft hover:text-foreground transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
          {isLoading && (
            <div className="flex min-h-32 items-center justify-center">
              <Spinner />
            </div>
          )}

          {isError && (
            <div className="flex min-h-32 flex-col items-center justify-center gap-2 text-center">
              <p className="text-sm text-muted">Could not load this thread.</p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary-soft"
              >
                Try again
              </button>
            </div>
          )}

          {thread && !isLoading && !isError && (
            <div className="space-y-4">
              <MessageBubble
                message={thread.parent}
                isMe={thread.parent.senderId === session?.user?.id}
                showSender={isGroup}
                currentUserId={session?.user?.id}
                onReact={onReact}
                onPin={onPin}
              />

              <div className="flex items-center gap-2">
                <span className="h-px flex-1 bg-border" />
                <span className="text-[10px] uppercase tracking-wide text-muted">
                  Replies
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>

              {thread.replies.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted">
                  No replies yet. Start the conversation.
                </p>
              ) : (
                thread.replies.map((reply) => (
                  <MessageBubble
                    key={reply.id}
                    message={reply}
                    isMe={reply.senderId === session?.user?.id}
                    showSender={isGroup}
                    hideParent
                    currentUserId={session?.user?.id}
                    onReact={onReact}
                    onPin={onPin}
                  />
                ))
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="safe-area-bottom shrink-0">
          <ChatInput
            input={input}
            onChange={setInput}
            onSend={handleSend}
            onUpload={() => {}}
            showAttachments={false}
            disabled={disabled || isSending}
            placeholder={
              disabled
                ? "You cannot reply in this group"
                : isSending
                  ? "Sending..."
                  : "Reply in thread..."
            }
          />
        </div>
      </aside>
    </>
  );
}
