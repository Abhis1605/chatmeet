"use client";

import { useChatUIStore } from "@/store/chat-ui-store";
import { useState, useEffect } from "react";
import ChatSearchCommand from "./ChatSearchCommand";
import { useSession } from "next-auth/react";
import GroupCreateModal from "./group/GroupCreateModal";
import { Archive, AtSign, BellOff, Inbox, Plus } from "lucide-react";
import { useChats } from "@/hooks/queries/use-chats";
import Spinner from "./Spinner";
import { getAvatarSrc } from "@/lib/avatars";

export default function ChatListPanel({ type }: any) {
  const { data: session } = useSession();

  const { setActiveChatId, activeChatId, setMobilePanel } = useChatUIStore();
  const [showArchived, setShowArchived] = useState(false);
  const { data: chats, isLoading } = useChats(type, showArchived);

  const [openSearch, setOpenSearch] = useState(false);
  const [openGroupCreate, setOpenGroupCreate] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatPresence = (user: any) => {
    if (user?.isOnline) return "Online";
    if (!user?.lastSeen) return "Offline";

    return `Last seen ${new Intl.DateTimeFormat("en", {
      hour: "numeric",
      minute: "2-digit",
      month: "short",
      day: "numeric",
    }).format(new Date(user.lastSeen))}`;
  };

  const formatRelativeTime = (dateStr: string) => {
    const diff = new Date().getTime() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(dateStr));
  };

  return (
    <div className="flex h-full w-full min-w-0 flex-col border-r border-border md:w-full">
      {/* HEADER */}
      <div className="p-3 border-b border-border flex justify-between items-center">
        <h2 className="text-foreground font-semibold capitalize">
          {showArchived ? "Archived" : type} chats
        </h2>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            title={showArchived ? "Back to inbox" : "Archived chats"}
            aria-label={showArchived ? "Back to inbox" : "Archived chats"}
            onClick={() => setShowArchived((value) => !value)}
            className={`rounded-md p-2 transition cursor-pointer ${
              showArchived
                ? "bg-primary-soft text-primary"
                : "text-muted hover:bg-surface-soft hover:text-foreground"
            }`}
          >
            {showArchived ? <Inbox className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
          </button>

          {type === "group" ? (
            <button
              type="button"
              title="Create group"
              aria-label="Create group"
              onClick={() => setOpenGroupCreate(true)}
              className="btn-primary py-1.5! px-3! text-sm! cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Create
            </button>
          ) : (
            <button
              onClick={() => setOpenSearch(true)}
              className="btn-primary py-1.5! px-4! text-sm! cursor-pointer"
            >
              Search
            </button>
          )}
        </div>
      </div>

      <ChatSearchCommand open={openSearch} setOpen={setOpenSearch} />
      <GroupCreateModal open={openGroupCreate} onClose={() => setOpenGroupCreate(false)} />

      {/* CHAT LIST */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && <Spinner />}

        {!isLoading && Array.isArray(chats) && chats.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 p-8 text-center text-muted">
            <img
              src={type === "personal" ? "/empty-state-no-messages.png" : "/empty-state-no-chats.png"}
              alt="No chats"
              className="w-32 h-32 object-contain opacity-90"
            />
            <p className="text-sm capitalize">
              {showArchived
                ? "No archived chats"
                : `No ${type} chats yet`}
            </p>
          </div>
        )}

        {Array.isArray(chats) &&
          [...chats].sort((a, b) => {
            const dateA = a.lastMessage?.createdAt || a.updatedAt;
            const dateB = b.lastMessage?.createdAt || b.updatedAt;
            return new Date(dateB).getTime() - new Date(dateA).getTime();
          }).map((chat, index) => {
            const otherUser = chat.members?.find(
              (m: any) => (m.userId ?? m.user?.id) !== session?.user?.id,
            )?.user;

            const lastMessage = chat.lastMessage;
            const title = chat.isGroup
              ? chat.name
              : otherUser?.name || otherUser?.email;
            const subtitle = chat.isGroup
              ? `${chat.members?.length ?? 0} members`
              : formatPresence(otherUser);

            const hasUnread = (chat.unreadCount || 0) > 0;
            const mentionCount = chat.mentionCount || 0;
            const currentMember = chat.members?.find(
              (m: any) => (m.userId ?? m.user?.id) === session?.user?.id
            );
            const isMuted = Boolean(
              currentMember?.mutedUntil &&
                new Date(currentMember.mutedUntil).getTime() > Date.now()
            );
            const previewText =
              lastMessage?.type === "IMAGE"
                ? "Photo"
                : lastMessage?.type === "VIDEO"
                  ? "Video"
                  : lastMessage?.type === "AUDIO"
                    ? "Voice message"
                    : lastMessage?.type === "FILE"
                      ? lastMessage.fileName || "File"
                      : lastMessage?.content;
            const preview =
              previewText && previewText.length > 40
                ? `${previewText.substring(0, 40)}...`
                : previewText;

            return (
              <div
                key={chat.id || index}
                onClick={() => {
                  setActiveChatId(chat.id);
                  setMobilePanel("detail");
                }}
                className={`p-3 flex items-center gap-3 cursor-pointer transition ${activeChatId === chat.id ? "bg-primary-soft" : "hover:bg-surface-soft"
                  }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <img
                    alt="avatar-img"
                    src={
                      chat.isGroup
                        ? chat.image || "/chatmeet-collapsed-logo.png"
                        : getAvatarSrc(otherUser)
                    }
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {!chat.isGroup && (
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-surface ${
                        otherUser?.isOnline ? "bg-green-500" : "bg-muted"
                      }`}
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex min-w-0 items-center gap-1">
                      <p className={`truncate text-sm ${hasUnread ? "text-foreground font-bold" : "text-foreground font-medium"}`}>
                        {title}
                      </p>
                      {isMuted && <BellOff size={12} className="shrink-0 text-muted" />}
                    </div>
                    {mounted && lastMessage?.createdAt && (
                      <span className="text-[10px] text-muted whitespace-nowrap ml-2">
                        {formatRelativeTime(lastMessage.createdAt)}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <p className={`text-xs truncate mr-2 ${hasUnread ? "text-foreground font-bold" : "text-muted"}`}>
                      {preview || "No messages yet"}
                    </p>
                    <div className="flex shrink-0 items-center gap-1">
                      {mentionCount > 0 && (
                        <span className="flex items-center gap-0.5 rounded-full bg-error px-1.5 py-0.5 text-[10px] font-bold text-white">
                          <AtSign size={10} />
                          {mentionCount > 9 ? "9+" : mentionCount}
                        </span>
                      )}
                      {hasUnread && (
                        <span className="bg-primary text-on-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                          {(chat.unreadCount || 0) > 9 ? "9+" : chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {!hasUnread && (
                    <p
                      className={`text-[10px] mt-1 ${!chat.isGroup && otherUser?.isOnline
                          ? "text-green-400"
                          : "text-muted"
                        }`}
                    >
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
