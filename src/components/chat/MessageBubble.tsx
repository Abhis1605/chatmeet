"use client";

import { File, Pencil, Trash2 } from "lucide-react";

interface Props {
  message: any;
  isMe: boolean;
  showSender?: boolean;
  onEdit?: (message: any) => void;
  onDelete?: (message: any) => void;
}

export default function MessageBubble({ message, isMe, showSender = false, onEdit, onDelete }: Props) {
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className="group relative"
      >
      <div
        className={`max-w-[min(320px,80vw)] rounded-lg border px-3 py-2 shadow-sm ${
          isMe
            ? "bg-surface-soft border-primary/30 rounded-br-none"
            : "bg-surface border-border rounded-bl-none"
        }`}
      >
        {showSender && !isMe && (
          <p className="mb-1 text-[11px] font-medium text-primary">
            {message.sender?.name || message.sender?.email}
          </p>
        )}

        {isMe && (onEdit || onDelete) && (
          <div className="absolute -top-3 right-1 hidden items-center gap-1 rounded-md border border-border bg-surface px-1 py-1 shadow-sm group-hover:flex">
            {message.type === "TEXT" && onEdit && (
              <button type="button" onClick={() => onEdit(message)} title="Edit message" className="rounded p-1 text-muted hover:bg-surface-soft hover:text-foreground">
                <Pencil size={13} />
              </button>
            )}
            {onDelete && (
              <button type="button" onClick={() => onDelete(message)} title="Delete message" className="rounded p-1 text-muted hover:bg-error/10 hover:text-error">
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}

        {/* TEXT */}
        {message.type === "TEXT" && (
          <p className="text-sm wrap-break-word text-foreground">{message.content}</p>
        )}

        {/* IMAGE */}
        {message.type === "IMAGE" && (
          <img
            src={message.fileUrl}
            alt={message.fileName}
            className="max-w-full rounded-xl object-cover transition hover:opacity-95"
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
              <p className="font-medium text-foreground">{message.fileName}</p>

              <p className="text-xs text-muted">
                {(message.fileSize / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </a>
        )}

        <p className="text-[10px] text-right mt-1 text-muted">
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
      </div>
    </div>
  );
}
