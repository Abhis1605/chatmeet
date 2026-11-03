"use client";

import { CornerUpLeft, File, MessageSquare, Pencil, Trash2 } from "lucide-react";

interface Props {
  message: any;
  isMe: boolean;
  showSender?: boolean;
  replyCount?: number;
  hideParent?: boolean;
  onReply?: (message: any) => void;
  onOpenThread?: (message: any) => void;
  onEdit?: (message: any) => void;
  onDelete?: (message: any) => void;
}

function previewText(message: any) {
  if (message.type === "IMAGE") return "Photo";
  if (message.type === "VIDEO") return "Video";
  if (message.type === "FILE") return message.fileName || "File";
  return message.content || "";
}

export default function MessageBubble({
  message,
  isMe,
  showSender = false,
  replyCount = 0,
  hideParent = false,
  onReply,
  onOpenThread,
  onEdit,
  onDelete,
}: Props) {
  const canEdit = isMe && message.type === "TEXT" && Boolean(onEdit);
  const canDelete = isMe && Boolean(onDelete);
  const isOptimistic = message._isOptimistic === true;

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div className="group relative">
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

          {!isOptimistic && (onReply || onOpenThread || canEdit || canDelete) && (
            <div
              className={`absolute -top-3 ${
                isMe ? "right-1" : "left-1"
              } hidden items-center gap-1 rounded-md border border-border bg-surface px-1 py-1 shadow-sm group-hover:flex`}
            >
              {onReply && (
                <button
                  type="button"
                  onClick={() => onReply(message)}
                  title="Reply"
                  aria-label="Reply"
                  className="rounded p-1 text-muted hover:bg-surface-soft hover:text-foreground"
                >
                  <CornerUpLeft size={13} />
                </button>
              )}
              {onOpenThread && (
                <button
                  type="button"
                  onClick={() => onOpenThread(message)}
                  title="Reply in thread"
                  aria-label="Reply in thread"
                  className="rounded p-1 text-muted hover:bg-surface-soft hover:text-foreground"
                >
                  <MessageSquare size={13} />
                </button>
              )}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => onEdit?.(message)}
                  title="Edit message"
                  aria-label="Edit message"
                  className="rounded p-1 text-muted hover:bg-surface-soft hover:text-foreground"
                >
                  <Pencil size={13} />
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={() => onDelete?.(message)}
                  title="Delete message"
                  aria-label="Delete message"
                  className="rounded p-1 text-muted hover:bg-error/10 hover:text-error"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          )}

          {message.parent && !hideParent && (
            <div className="mb-2 rounded-md border-l-2 border-primary/60 bg-surface-soft/70 px-2 py-1">
              <p className="text-[10px] font-medium text-primary">
                {message.parent.sender?.name || message.parent.sender?.email}
              </p>
              <p className="truncate text-xs text-muted">
                {previewText(message.parent)}
              </p>
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

        {(onReply || onOpenThread) && (
          <div
            className={`mt-1 flex items-center gap-3 ${isMe ? "justify-end" : "justify-start"}`}
          >
            {onReply && (
              <button
                type="button"
                onClick={() => onReply(message)}
                className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
              >
                <CornerUpLeft size={12} />
                Reply
              </button>
            )}
            {onOpenThread && (
              <button
                type="button"
                onClick={() => onOpenThread(message)}
                className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
              >
                <MessageSquare size={12} />
                {replyCount > 0
                  ? `${replyCount} ${replyCount === 1 ? "reply" : "replies"}`
                  : message.parentId
                    ? "View thread"
                    : "Thread"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
