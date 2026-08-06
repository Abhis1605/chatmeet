"use client";

import { useChatUIStore } from "@/store/chat-ui-store";
import { useState, useEffect } from "react";
import ChatSearchCommand from "./ChatSearchCommand";
import { useSession } from "next-auth/react";
import GroupCreateModal from "./group/GroupCreateModal";
import { Plus } from "lucide-react";
import { useChats } from "@/hooks/queries/use-chats";

export default function ChatListPanel({ type }: any) {
  const { data: session } = useSession();

  const { setActiveChatId, activeChatId } = useChatUIStore();
  const { data: chats, isLoading } = useChats(type);

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
    <div className="w-[320px] border-r border-white/10 flex flex-col">
      {/* HEADER */}
      <div className="p-3 border-b border-white/10 flex justify-between items-center">
        <h2 className="text-white font-semibold capitalize">{type} chats</h2>

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

      <ChatSearchCommand open={openSearch} setOpen={setOpenSearch} />
      <GroupCreateModal open={openGroupCreate} onClose={() => setOpenGroupCreate(false)} />

      {/* CHAT LIST */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>}
        {Array.isArray(chats) &&
          [...chats].sort((a, b) => {
            const dateA = a.lastMessage?.createdAt || a.updatedAt;
            const dateB = b.lastMessage?.createdAt || b.updatedAt;
            return new Date(dateB).getTime() - new Date(dateA).getTime();
          }).map((chat, index) => {
            const otherUser = chat.members?.find(
              (m: any) => m.user.id !== session?.user?.id,
            )?.user;

            const lastMessage = chat.lastMessage;
            const title = chat.isGroup
              ? chat.name
              : otherUser?.name || otherUser?.email;
            const subtitle = chat.isGroup
              ? `${chat.members?.length ?? 0} members`
              : formatPresence(otherUser);

            const hasUnread = (chat.unreadCount || 0) > 0;

            return (
              <div
                key={chat.id || index}
                onClick={() => setActiveChatId(chat.id)}
                className={`p-3 flex items-center gap-3 cursor-pointer transition ${activeChatId === chat.id ? "bg-white/10" : "hover:bg-white/5"
                  }`}
              >
                {/* Avatar */}
                <img
                  alt="avatar-img"
                  src={
                    chat.isGroup
                      ? "/chatmeet-collapsed-logo.png"
                      : otherUser?.image || "/default-avatar.png"
                  }
                  className="w-10 h-10 rounded-full object-cover"
                />

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex justify-between items-center mb-1">
                    <p className={`text-sm truncate ${hasUnread ? "text-white font-bold" : "text-gray-200 font-medium"}`}>
                      {title}
                    </p>
                    {mounted && lastMessage?.createdAt && (
                      <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">
                        {formatRelativeTime(lastMessage.createdAt)}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <p className={`text-xs truncate mr-2 ${hasUnread ? "text-gray-200 font-bold" : "text-gray-400"}`}>
                      {lastMessage?.content ? (lastMessage.content.length > 40 ? lastMessage.content.substring(0, 40) + "..." : lastMessage.content) : "No messages yet"}
                    </p>
                    {hasUnread && (
                      <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {(chat.unreadCount || 0) > 9 ? "9+" : chat.unreadCount}
                      </span>
                    )}
                  </div>

                  {!hasUnread && (
                    <p
                      className={`text-[10px] mt-1 ${!chat.isGroup && otherUser?.isOnline
                          ? "text-green-400"
                          : "text-gray-500"
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
