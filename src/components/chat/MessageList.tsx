"use client";

import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

interface Props {
  messages: any[];
  session: any;
  isGroup?: boolean;
}

export default function MessageList({ messages, session, isGroup = false }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [messages]);

  if (!messages.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        No messages yet
      </div>
    );
  }

  return (
    <div className="chat-scroll flex-1 flex flex-col overflow-y-auto p-5 space-y-4">
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
