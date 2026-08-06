"use client";

import { useState, useEffect } from "react";
import { LogIn, Plus } from "lucide-react";
import { useChatUIStore } from "@/store/chat-ui-store";
import { useRooms } from "@/hooks/queries/use-rooms";
import CreateRoomModal from "./CreateRoomModal";
import JoinRoomModal from "./JoinRoomModal";
import PendingInvitesList from "./PendingInvitesList";

export default function RoomListPanel() {
  const { activeRoomChatId, setActiveRoomChatId } = useChatUIStore();
  const { data: rooms = [], isLoading } = useRooms();

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
    <div className="w-[320px] border-r border-white/10 flex flex-col">
      <div className="p-3 border-b border-white/10 flex justify-between items-center">
        <h2 className="text-white font-semibold">Rooms</h2>
        <div className="flex gap-1">
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
        {isLoading && (
          <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
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

            return (
              <div
                key={room.id}
                onClick={() => setActiveRoomChatId(room.id)}
                className={`p-3 flex items-center gap-3 cursor-pointer transition ${
                  activeRoomChatId === room.id ? "bg-white/10" : "hover:bg-white/5"
                }`}
              >
                <img
                  alt="room"
                  src="/chatmeet-collapsed-logo.png"
                  className="w-10 h-10 rounded-full object-cover"
                />

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex justify-between items-center mb-1">
                    <p
                      className={`text-sm truncate ${
                        hasUnread ? "text-white font-bold" : "text-gray-200 font-medium"
                      }`}
                    >
                      {room.name}
                    </p>
                    {mounted && lastMessage?.createdAt && (
                      <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">
                        {formatRelativeTime(lastMessage.createdAt)}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <p
                      className={`text-xs truncate mr-2 ${
                        hasUnread ? "text-gray-200 font-bold" : "text-gray-400"
                      }`}
                    >
                      {lastMessage?.content
                        ? lastMessage.content.length > 40
                          ? `${lastMessage.content.substring(0, 40)}...`
                          : lastMessage.content
                        : "No messages yet"}
                    </p>
                    {hasUnread && (
                      <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {(room.unreadCount || 0) > 9 ? "9+" : room.unreadCount}
                      </span>
                    )}
                  </div>

                  {!hasUnread && (
                    <p className="text-[10px] mt-1 text-gray-500">
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
