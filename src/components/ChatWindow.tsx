"use client";

import { useEffect, useState } from "react";
import { connectSocket } from "@/lib/socket";
import { useChatStore } from "@/store/useChatStore";
import { useSession } from "next-auth/react";

export default function ChatWindow() {
    const { selectedChat } = useChatStore()
    const { data: session } = useSession()

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    if (!selectedChat || !session) return;

    const token = (session as any).accessToken;

    const s = connectSocket(token);
    setSocket(s);

    s.emit("join-chat", selectedChat.id);

    s.on("new-message", (msg: any) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      s.disconnect();
    };
  }, [selectedChat, session]);

  const sendMessage = () => {
    if (!input || !socket || !selectedChat) return;

    socket.emit("send-message", {
      chatId: selectedChat.id,
      content: input,
    });

    setInput("");
  };

  if (!selectedChat) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        Select a chat
      </div>
    );
  }

   return (
    <div className="h-full flex flex-col">

      {/* HEADER */}
      <div className="p-4 border-b border-white/10 text-white font-medium">
        {selectedChat.name || "Chat"}
      </div>

      {/* MESSAGES */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`px-3 py-2 rounded w-fit ${
              m.senderId === session?.user?.id
                ? "bg-blue-600 ml-auto"
                : "bg-gray-700"
            }`}
          >
            {m.content}
          </div>
        ))}
      </div>

      {/* INPUT */}
      <div className="p-4 flex gap-2 border-t border-white/10">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-2 rounded text-black"
          placeholder="Type message..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 px-4 rounded text-white"
        >
          Send
        </button>
      </div>

    </div>
  );
}