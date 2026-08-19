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
}

export default function MessageList({
  messages,
  session,
  isGroup = false,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: Props) {
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
      <div className="flex-1 flex items-center justify-center text-muted">
        No messages yet
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
        <MessageBubble
          key={message.id}
          message={message}
          isMe={message.senderId === session?.user?.id}
          showSender={isGroup}
        />
      ))}

      <div ref={bottomRef} />
    </div>
  );
}
