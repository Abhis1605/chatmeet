"use client";

import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

interface Props {
  messages: any[];
  session: any;
  isGroup?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onEditMessage?: (message: any) => void;
  onDeleteMessage?: (message: any) => void;
  // 1:1 chats: when the other person last read the chat (null = receipts hidden)
  otherReadAt?: string | null;
  groupSeenByCount?: number;
  groupRecipientCount?: number;
}

export default function MessageList({
  messages,
  session,
  isGroup = false,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  onEditMessage,
  onDeleteMessage,
  otherReadAt = null,
  groupSeenByCount,
  groupRecipientCount = 0,
}: Props) {
  // Read status is shown once, under my most recent message
  const myLastMessage = [...messages].reverse().find(
    (message) => message.senderId === session?.user?.id
  );
  const myLastStatus = isGroup
    ? myLastMessage && groupSeenByCount !== undefined
      ? groupSeenByCount > 0
        ? `Seen by ${groupSeenByCount}${groupRecipientCount > 0 && groupSeenByCount === groupRecipientCount ? " (everyone)" : ""}`
        : "Sent"
      : null
    : myLastMessage && otherReadAt
      ? new Date(otherReadAt) >= new Date(myLastMessage.createdAt)
        ? "Seen"
        : "Sent"
      : null;

  const bottomRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number | null>(null);

  useEffect(() => {
    // Only auto-scroll to bottom on initial load / new messages, not when
    // older messages were just prepended via "load more".
    if (prevScrollHeightRef.current !== null) return;
    bottomRef.current?.scrollIntoView();
  }, [messages]);

  // Preserve scroll position when older messages are prepended above.
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || prevScrollHeightRef.current === null) return;

    container.scrollTop += container.scrollHeight - prevScrollHeightRef.current;
    prevScrollHeightRef.current = null;
  }, [messages]);

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    const container = scrollContainerRef.current;
    if (!sentinel || !container || !hasMore || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingMore) {
          prevScrollHeightRef.current = container.scrollHeight;
          onLoadMore();
        }
      },
      { root: container, threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore, isLoadingMore]);

  if (!messages.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted">
        <img
          src="/empty-state-no-messages.png"
          alt="No messages"
          className="w-40 h-40 object-contain opacity-90"
        />
        <p className="text-sm">No messages yet</p>
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      className="chat-scroll flex-1 flex flex-col overflow-y-auto p-5 space-y-4"
    >
      <div ref={topSentinelRef} />
      {isLoadingMore && (
        <div className="text-center text-muted text-xs">Loading older messages...</div>
      )}

      {messages.map((message) => (
        <div key={message.id}>
          <MessageBubble
            message={message}
            isMe={message.senderId === session?.user?.id}
            showSender={isGroup}
            onEdit={onEditMessage}
            onDelete={onDeleteMessage}
          />
          {message.id === myLastMessage?.id && myLastStatus && (
            <p
              className={`mt-1 text-right text-[10px] ${
                myLastStatus === "Seen" ? "text-primary" : "text-muted"
              }`}
            >
              {myLastStatus}
            </p>
          )}
        </div>
      ))}

      <div ref={bottomRef} />
    </div>
  );
}
