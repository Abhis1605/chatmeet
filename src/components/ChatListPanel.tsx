"use client";

import { useChatStore } from "@/store/useChatStore";
import { useEffect, useState } from "react";

export default function ChatListPanel({ type }: any) {
  const { setSelectedChat } = useChatStore()

  const [chats, setChats] = useState<any[]>([])

  useEffect(() => {
    const fetchChats = async () => {
      const res = await fetch(`/api/chat/list?type=${type}`);
      const data = await res.json();
      setChats(data);
    };

    fetchChats();
  }, [type]);

  return (
    <div className="w-[320px] border-r border-white/10 flex flex-col">

      {/* HEADER */}
      <div className="p-6 border-b border-white/10">
        <h2 className="text-white font-semibold capitalize">
          {type} chats
        </h2>
      </div>

      {/* CHAT LIST */}
      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => setSelectedChat(chat)}
            className="p-3 flex items-center gap-3 hover:bg-white/5 cursor-pointer transition"
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gray-600" />

            {/* Info */}
            <div className="flex-1">
              <p className="text-white text-sm font-medium">
                {chat.name || "User"}
              </p>
              <p className="text-gray-400 text-xs truncate">
                Last message...
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}