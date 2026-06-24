"use client";

import { useChatStore } from "@/store/useChatStore";
import { useEffect, useState } from "react";
import ChatSearchCommand from "./ChatSearchCommand";
import { useSession } from "next-auth/react";

export default function ChatListPanel({ type }: any) {

  const { data: session } = useSession()

  const { setSelectedChat, selectedChat } = useChatStore();

  const { chats, setChats } = useChatStore();

  const [openSearch, setOpenSearch] = useState(false);

  useEffect(() => {
    const fetchChats = async () => {
      const res = await fetch(`/api/chat/list?type=${type}`);
      const data = await res.json();
      setChats(data);
    };

    fetchChats();
  }, [type, setChats]);

  return (
    <div className="w-[320px] border-r border-white/10 flex flex-col">
      {/* HEADER */}
      <div className="p-3 border-b border-white/10 flex justify-between items-center">
        <h2 className="text-white font-semibold capitalize">{type} chats</h2>

        <button
          onClick={() => setOpenSearch(true)}
          className="text-sm bg-white/10 px-3 py-1 rounded hover:bg-white/20 cursor-pointer"
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
                  {otherUser?.name || otherUser?.email}
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