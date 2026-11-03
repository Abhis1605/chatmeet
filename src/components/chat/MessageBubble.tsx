"use client";

import { useState } from "react";
import {
  CornerUpLeft,
  File,
  Forward,
  MessageSquare,
  Pencil,
  Pin,
  PinOff,
  SmilePlus,
  Trash2,
} from "lucide-react";
import { splitMentionParts } from "@/lib/mentions";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

interface Props {
  message: any;
  isMe: boolean;
  showSender?: boolean;
  replyCount?: number;
  hideParent?: boolean;
  currentUserId?: string;
  onReply?: (message: any) => void;
  onOpenThread?: (message: any) => void;
  onEdit?: (message: any) => void;
  onDelete?: (message: any) => void;
  onReact?: (message: any, emoji: string) => void;
  onPin?: (message: any) => void;
  onForward?: (message: any) => void;
}

function previewText(message: any) {
  if (message.type === "IMAGE") return "Photo";
  if (message.type === "VIDEO") return "Video";
  if (message.type === "AUDIO") return "Voice message";
  if (message.type === "FILE") return message.fileName || "File";
  return message.content || "";
}

function MessageContent({
  content,
  currentUserId,
  mentions,
}: {
  content: string;
  currentUserId?: string;
  mentions?: Array<{ userId: string }>;
}) {
  const mentionsMe = Boolean(
    currentUserId && mentions?.some((mention) => mention.userId === currentUserId)
  );

  return (
    <p className="whitespace-pre-wrap wrap-break-word text-sm text-foreground">
      {splitMentionParts(content).map((part, index) =>
        part.mention ? (
          <span
            key={index}
            className={`rounded px-0.5 font-medium ${
              mentionsMe
                ? "bg-primary/20 text-primary"
                : "bg-primary-soft text-primary"
            }`}
          >
            {part.text}
          </span>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </p>
  );
}

export default function MessageBubble({
  message,
  isMe,
  showSender = false,
  replyCount = 0,
  hideParent = false,
  currentUserId,
  onReply,
  onOpenThread,
  onEdit,
  onDelete,
  onReact,
  onPin,
  onForward,
}: Props) {
  const [showReactions, setShowReactions] = useState(false);
  const canEdit = isMe && message.type === "TEXT" && Boolean(onEdit);
  const canDelete = isMe && Boolean(onDelete);
  const canPin = Boolean(onPin);
  const canForward = Boolean(onForward);
  const canReact = Boolean(onReact);
  const isOptimistic = message._isOptimistic === true;
  const isPinned = Boolean(message.pinnedAt);

  const reactions: Array<{ emoji: string; userId: string }> = message.reactions ?? [];
  const groupedReactions = new Map<string, { count: number; mine: boolean }>();
  for (const reaction of reactions) {
    const entry = groupedReactions.get(reaction.emoji) ?? { count: 0, mine: false };
    entry.count += 1;
    if (currentUserId && reaction.userId === currentUserId) entry.mine = true;
    groupedReactions.set(reaction.emoji, entry);
  }

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div className="group relative max-w-[min(360px,85vw)]">
        <div
          className={`rounded-lg border px-3 py-2 shadow-sm ${
            isMe
              ? "bg-surface-soft border-primary/30 rounded-br-none"
              : "bg-surface border-border rounded-bl-none"
          } ${isPinned ? "ring-1 ring-primary/40" : ""}`}
        >
          {showSender && !isMe && (
            <p className="mb-1 text-[11px] font-medium text-primary">
              {message.sender?.name || message.sender?.email}
            </p>
          )}

          {!isOptimistic &&
            (onReply ||
              onOpenThread ||
              canEdit ||
              canDelete ||
              canReact ||
              canPin ||
              canForward) && (
              <div
                className={`absolute -top-3 ${
                  isMe ? "right-1" : "left-1"
                } z-10 hidden items-center gap-1 rounded-md border border-border bg-surface px-1 py-1 shadow-sm group-hover:flex`}
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
                {canReact && (
                  <button
                    type="button"
                    onClick={() => setShowReactions((open) => !open)}
                    title="React"
                    aria-label="Add reaction"
                    className="rounded p-1 text-muted hover:bg-surface-soft hover:text-foreground"
                  >
                    <SmilePlus size={13} />
                  </button>
                )}
                {canPin && (
                  <button
                    type="button"
                    onClick={() => onPin?.(message)}
                    title={isPinned ? "Unpin message" : "Pin message"}
                    aria-label={isPinned ? "Unpin message" : "Pin message"}
                    className="rounded p-1 text-muted hover:bg-surface-soft hover:text-foreground"
                  >
                    {isPinned ? <PinOff size={13} /> : <Pin size={13} />}
                  </button>
                )}
                {canForward && (
                  <button
                    type="button"
                    onClick={() => onForward?.(message)}
                    title="Forward"
                    aria-label="Forward message"
                    className="rounded p-1 text-muted hover:bg-surface-soft hover:text-foreground"
                  >
                    <Forward size={13} />
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
                    className="rounded p-1 text-muted hover:bg-surface-soft hover:text-error"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            )}

          {showReactions && (
            <div className="absolute -top-11 right-0 z-20 flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-1 shadow-lg">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onReact?.(message, emoji);
                    setShowReactions(false);
                  }}
                  className="rounded-full px-1 text-lg leading-none transition hover:scale-125"
                  aria-label={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {isPinned && (
            <p className="mb-1 flex items-center gap-1 text-[10px] font-medium text-primary">
              <Pin size={10} /> Pinned
            </p>
          )}

          {message.forwardedFrom && !hideParent && (
            <p className="mb-1 flex items-center gap-1 text-[10px] font-medium text-muted">
              <Forward size={10} />
              Forwarded from{" "}
              {message.forwardedFrom.sender?.name ||
                message.forwardedFrom.sender?.email ||
                "unknown"}
            </p>
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
            <MessageContent
              content={message.content ?? ""}
              currentUserId={currentUserId}
              mentions={message.mentions}
            />
          )}

          {/* IMAGE */}
          {message.type === "IMAGE" && (
            <img
              src={message.fileUrl}
              alt={message.fileName || "Shared image"}
              className="max-w-full rounded-xl object-cover transition hover:opacity-95"
            />
          )}

          {/* VIDEO */}
          {message.type === "VIDEO" && (
            <video
              src={message.fileUrl}
              controls
              playsInline
              className="max-w-full rounded-xl bg-black"
            />
          )}

          {/* AUDIO / voice note */}
          {message.type === "AUDIO" && (
            <div className="min-w-[220px] py-1">
              <audio
                src={message.fileUrl}
                controls
                preload="metadata"
                className="h-9 w-full"
              />
            </div>
          )}

          {/* FILE */}
          {message.type === "FILE" && (
            <a
              href={message.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl bg-surface-soft p-3 transition hover:bg-surface"
            >
              <File className="w-7 h-7" />
              <div>
                <p className="font-medium text-foreground">{message.fileName}</p>
                <p className="text-xs text-muted">
                  {((message.fileSize ?? 0) / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </a>
          )}

          {/* Link preview */}
          {message.linkPreview?.url && (
            <a
              href={message.linkPreview.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block overflow-hidden rounded-xl border border-border bg-surface-soft transition hover:border-primary/40"
            >
              {message.linkPreview.image && (
                <img
                  src={message.linkPreview.image}
                  alt=""
                  className="max-h-44 w-full object-cover"
                  loading="lazy"
                />
              )}
              <div className="space-y-0.5 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-muted">
                  {message.linkPreview.siteName}
                </p>
                {message.linkPreview.title && (
                  <p className="line-clamp-2 text-sm font-semibold text-foreground">
                    {message.linkPreview.title}
                  </p>
                )}
                {message.linkPreview.description && (
                  <p className="line-clamp-2 text-xs text-muted">
                    {message.linkPreview.description}
                  </p>
                )}
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

        {/* Reaction pills */}
        {groupedReactions.size > 0 && (
          <div
            className={`mt-1 flex flex-wrap gap-1 ${isMe ? "justify-end" : "justify-start"}`}
          >
            {[...groupedReactions.entries()].map(([emoji, info]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onReact?.(message, emoji)}
                disabled={!canReact}
                className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition ${
                  info.mine
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border bg-surface text-muted hover:bg-surface-soft"
                } ${canReact ? "cursor-pointer" : "cursor-default"}`}
                aria-label={`${emoji} ${info.count}`}
              >
                <span>{emoji}</span>
                <span>{info.count}</span>
              </button>
            ))}
          </div>
        )}

        {(onReply || onOpenThread || canReact) && (
          <div
            className={`mt-1 flex items-center gap-3 ${
              isMe ? "justify-end" : "justify-start"
            }`}
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
            {canReact && (
              <button
                type="button"
                onClick={() => setShowReactions((open) => !open)}
                className="flex items-center gap-1 text-[11px] font-medium text-muted hover:text-foreground"
              >
                <SmilePlus size={12} />
                React
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
