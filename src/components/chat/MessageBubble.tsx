"use client";

import { File } from "lucide-react";

interface Props {
  message: any;
  isMe: boolean;
  showSender?: boolean;
}

export default function MessageBubble({ message, isMe, showSender = false }: Props) {
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`rounded-2xl px-3 py-2 max-w-[320px] ${
          isMe ? "bg-primary rounded-tr-none" : "bg-surface-soft rounded-tl-none"
        }`}
      >
        {showSender && !isMe && (
          <p className="mb-1 text-[11px] font-medium text-primary">
            {message.sender?.name || message.sender?.email}
          </p>
        )}

        {/* TEXT */}
        {message.type === "TEXT" && (
          <p className={`text-sm wrap-break-word ${isMe ? "text-on-primary" : "text-foreground"}`}>{message.content}</p>
        )}

        {/* IMAGE */}
        {message.type === "IMAGE" && (
          <img
            src={message.fileUrl}
            alt={message.fileName}
            className="rounded-xl max-w-55 md:max-w-60 object-cover cursor-pointer transition hover:opacity-95"
          />
        )}

        {/* FILE */}
        {message.type === "FILE" && (
          <a
            href={message.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="
      flex
      items-center
      gap-3
      p-3
      rounded-xl
      bg-surface-soft
      hover:bg-surface
      transition
  "
          >
            <File className="w-7 h-7" />

            <div>
              <p className={`font-medium ${isMe ? "text-on-primary" : "text-foreground"}`}>{message.fileName}</p>

              <p className={`text-xs ${isMe ? "text-on-primary" : "text-muted"}`}>
                {(message.fileSize / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </a>
        )}

        <p className={`text-[10px] text-right mt-1 ${isMe ? "text-on-primary" : "text-muted"}`}>
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
