"use client";

import { ArrowLeft, Pin, Search, Users } from "lucide-react";
import { getAvatarSrc } from "@/lib/avatars";
import CallLauncher from "@/components/call/CallLauncher";
import ChatOptionsMenu from "./ChatOptionsMenu";

interface ChatHeaderProps {
  otherUser: any;
  presenceLabel: string;
  isTyping: boolean;
  chat?: any;
  onManageGroup?: () => void;
  onBack?: () => void;
  onOpenSearch?: () => void;
  onOpenPinned?: () => void;
  pinnedCount?: number;
  archivedAt?: string | null;
  mutedUntil?: string | null;
}

export default function ChatHeader({
  otherUser,
  presenceLabel,
  isTyping,
  chat,
  onManageGroup,
  onBack,
  onOpenSearch,
  onOpenPinned,
  pinnedCount = 0,
  archivedAt,
  mutedUntil,
}: ChatHeaderProps) {
  const title = chat?.isGroup ? chat.name : otherUser?.name || otherUser?.email;
  const subtitle = chat?.isGroup
    ? `${chat.members?.length ?? 0} members`
    : presenceLabel;

  return (
    <div className="flex min-h-16 items-center gap-2 border-b border-border bg-surface px-3 sm:h-18 sm:gap-3 sm:px-5">
      {onBack && (
        <button type="button" onClick={onBack} aria-label="Back to chats" className="rounded-md p-2 text-muted hover:bg-surface-soft hover:text-foreground lg:hidden">
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}

      <div className="relative shrink-0">
        <img
          src={chat?.isGroup ? chat.image || "/chatmeet-collapsed-logo.png" : getAvatarSrc(otherUser)}
          alt="avatar"
          className="w-11 h-11 rounded-full object-cover"
        />
        {!chat?.isGroup && (
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface ${
              otherUser?.isOnline ? "bg-green-500" : "bg-muted"
            }`}
          />
        )}
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <h3 className="text-foreground font-semibold">
          {title}
        </h3>

        <span
          className={`text-xs transition ${
            !chat?.isGroup && isTyping
              ? "text-green-400 animate-pulse"
              : !chat?.isGroup && otherUser?.isOnline
                ? "text-green-500"
                : "text-muted"
          }`}
        >
          {subtitle}
        </span>
      </div>

      {chat?.id && (
        <CallLauncher
          chatId={chat.id}
          callType={chat.isGroup ? "GROUP" : "ONE_TO_ONE"}
        />
      )}

      {chat?.id && onOpenSearch && (
        <button
          type="button"
          title="Search messages"
          aria-label="Search messages"
          onClick={onOpenSearch}
          className="p-2 rounded-md text-muted hover:bg-surface-soft hover:text-foreground transition cursor-pointer"
        >
          <Search className="w-5 h-5" />
        </button>
      )}

      {chat?.id && onOpenPinned && (
        <button
          type="button"
          title="Pinned messages"
          aria-label="Pinned messages"
          onClick={onOpenPinned}
          className="relative p-2 rounded-md text-muted hover:bg-surface-soft hover:text-foreground transition cursor-pointer"
        >
          <Pin className="w-5 h-5" />
          {pinnedCount > 0 && (
            <span className="absolute -right-1 -top-1 min-w-[16px] rounded-full bg-primary px-1 text-center text-[9px] font-bold leading-4 text-on-primary">
              {pinnedCount > 9 ? "9+" : pinnedCount}
            </span>
          )}
        </button>
      )}

      {chat?.id && (
        <ChatOptionsMenu
          chatId={chat.id}
          archivedAt={archivedAt ?? chat.archivedAt}
          mutedUntil={mutedUntil ?? chat.mutedUntil}
          onOpenSearch={onOpenSearch}
          onOpenPinned={onOpenPinned}
          pinnedCount={pinnedCount}
        />
      )}

      {chat?.isGroup && (
        <button
          type="button"
          title="Manage group"
          aria-label="Manage group"
          onClick={onManageGroup}
          className="p-2 rounded-md text-muted hover:bg-surface-soft hover:text-foreground transition cursor-pointer"
        >
          <Users className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
