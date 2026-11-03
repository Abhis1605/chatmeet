"use client";

import { useState, useEffect } from "react";
import { Archive, AtSign, BellOff, Inbox, LogIn, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useChatUIStore } from "@/store/chat-ui-store";
import { useRooms } from "@/hooks/queries/use-rooms";
import CreateRoomModal from "./CreateRoomModal";
import JoinRoomModal from "./JoinRoomModal";
import PendingInvitesList from "./PendingInvitesList";
import Spinner from "../Spinner";

export default function RoomListPanel() {
  const { data: session } = useSession();
  const { activeRoomChatId, setActiveRoomChatId, setMobilePanel } = useChatUIStore();
  const [showArchived, setShowArchived] = useState(false);
  const { data: rooms = [], isLoading } = useRooms(showArchived);

  const [openCreate, setOpenCreate] = useState(false);
  const [openJoin, setOpenJoin] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatRelativeTime = (dateStr: string) => {
    const diff = new Date().getTime() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
      new Date(dateStr)
    );
  };

  return (
    <div className="flex h-full w-full min-w-0 flex-col border-r border-border md:w-full">
      <div className="p-3 border-b border-border flex justify-between items-center">
        <h2 className="text-foreground font-semibold">
          {showArchived ? "Archived rooms" : "Rooms"}
        </h2>
        <div className="flex gap-1">
          <button
            type="button"
            title={showArchived ? "Back to rooms" : "Archived rooms"}
            aria-label={showArchived ? "Back to rooms" : "Archived rooms"}
            onClick={() => setShowArchived((value) => !value)}
            className={`rounded-md p-2 transition cursor-pointer ${
              showArchived
                ? "bg-primary-soft text-primary"
                : "text-muted hover:bg-surface-soft hover:text-foreground"
            }`}
          >
            {showArchived ? <Inbox className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
          </button>
          <button
            type="button"
            title="Join room"
            aria-label="Join room"
            onClick={() => setOpenJoin(true)}
            className="btn-primary py-1.5! px-2.5! text-sm! cursor-pointer flex items-center gap-1"
          >
            <LogIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Create room"
            aria-label="Create room"
            onClick={() => setOpenCreate(true)}
            className="btn-primary py-1.5! px-2.5! text-sm! cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <CreateRoomModal open={openCreate} onClose={() => setOpenCreate(false)} />
      <JoinRoomModal open={openJoin} onClose={() => setOpenJoin(false)} />

      <PendingInvitesList />

      <div className="flex-1 overflow-y-auto">
        {isLoading && <Spinner />}

        {!isLoading && rooms.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 p-8 text-center text-muted">
            <img
              src="/empty-state-no-chats.png"
              alt="No rooms"
              className="w-32 h-32 object-contain opacity-90"
            />
            <p className="text-sm">
              {showArchived ? "No archived rooms" : "No rooms yet"}
            </p>
          </div>
        )}

        {[...rooms]
          .sort((a, b) => {
            const dateA = a.lastMessage?.createdAt || a.updatedAt;
            const dateB = b.lastMessage?.createdAt || b.updatedAt;
            return new Date(dateB).getTime() - new Date(dateA).getTime();
          })
          .map((room) => {
            const lastMessage = room.lastMessage;
            const hasUnread = (room.unreadCount || 0) > 0;
            const mentionCount = room.mentionCount || 0;
            const currentMember = room.members.find(
              (member) =>
                (member.userId ?? member.user?.id) === session?.user?.id
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
                key={room.id}
                onClick={() => {
                  setActiveRoomChatId(room.id);
                  setMobilePanel("detail");
                }}
                className={`p-3 flex items-center gap-3 cursor-pointer transition ${
                  activeRoomChatId === room.id ? "bg-surface-soft" : "hover:bg-surface-soft"
                }`}
              >
                <img
                  alt="room"
                  src={room.image || "/chatmeet-collapsed-logo.png"}
                  className="w-10 h-10 rounded-full object-cover"
                />

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex min-w-0 items-center gap-1">
                      <p
                        className={`text-sm truncate ${
                          hasUnread ? "text-foreground font-bold" : "text-muted font-medium"
                        }`}
                      >
                        {room.name}
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
                    <p
                      className={`text-xs truncate mr-2 ${
                        hasUnread ? "text-muted font-bold" : "text-muted"
                      }`}
                    >
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
                          {(room.unreadCount || 0) > 9 ? "9+" : room.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {!hasUnread && (
                    <p className="text-[10px] mt-1 text-muted">
                      {room.members.length} members · {room.roomCode}
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
