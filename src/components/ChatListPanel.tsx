"use client";

import { useChatStore } from "@/store/useChatStore";
import { useEffect, useState } from "react";
import ChatSearchCommand from "./ChatSearchCommand";
import { useSession } from "next-auth/react";
import { getSocket } from "@/lib/socket";

export default function ChatListPanel({ type }: any) {

  const { data: session } = useSession()

  const { setSelectedChat, selectedChat } = useChatStore();

  const { chats, setChats } = useChatStore();

  const [openSearch, setOpenSearch] = useState(false);

  const fetchChats = async () => {
    const res = await fetch(`/api/chat/list?type=${type}`);
    if (res.ok) {
      const data = await res.json();
      setChats(data);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [type, setChats]);

  // Listen for global chat updates (new chats, etc)
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('chat-updated', () => {
      fetchChats();
    });

    return () => {
      socket.off('chat-updated');
    };
  }, [type]);

  return (
    <div className="w-[320px] border-r border-white/10 flex flex-col">
      {/* HEADER */}
      <div className="p-3 border-b border-white/10 flex justify-between items-center">
        <h2 className="text-white font-semibold capitalize">{type} chats</h2>

        <button
          onClick={() => setOpenSearch(true)}
          className="btn-primary !py-1.5 !px-4 !text-sm cursor-pointer"
        >
          Search
        </button>
      </div>

      <ChatSearchCommand open={openSearch} setOpen={setOpenSearch} />

      {/* CHAT LIST */}
      <div className="flex-1 overflow-y-auto">
        {Array.isArray(chats) && chats.map((chat, index) => {
          const otherUser = chat.members?.find(
            (m: any) => m.user.id !== session?.user?.id,
          )?.user;

          const lastMessage = chat.messages?.[0];

          return (
            <div
              key={chat.id || index}
              onClick={() => setSelectedChat(chat)}
              className={`p-3 flex items-center gap-3 cursor-pointer transition ${selectedChat?.id === chat.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
            >
              {/* Avatar */}
              <img
                alt="avatar-img"
                src={otherUser?.image || "/default-avatar.png"}
                className="w-10 h-10 rounded-full object-cover"
              />

              {/* Info */}
              <div className="flex-1">
                <p className="text-white text-sm font-medium">
                  {otherUser?.email}
                </p>

                <p className="text-gray-400 text-xs truncate">
                  {lastMessage?.content || "No messages yet"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}