"use client";

import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import { useChatStore } from "@/store/useChatStore";
import { useSession } from "next-auth/react";

export default function ChatWindow() {
  const { selectedChat, updateLastMessage } = useChatStore();
  const { data: session } = useSession();

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  const selectedChatRef = useRef<any>(null)

  useEffect(() => {
    selectedChatRef.current = selectedChat
  }, [selectedChat])

  // LOAD MESSAGES (with reset)
  useEffect(() => {
    if (!selectedChat?.id) return;

    setMessages([]); // clear previous chat

    const fetchMessages = async () => {
      const res = await fetch(`/api/message/${selectedChat.id}`);
      const data = await res.json();
      setMessages(data);
    };

    fetchMessages();
  }, [selectedChat]);

  // SOCKET LISTENERS
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !session) return;

    socket.on('new-message', (msg: any) => {
      if (msg.chatId === selectedChatRef.current?.id) {
        setMessages((prev) => [...prev, msg])
      }

      updateLastMessage(msg)
    })

    return () => {
      socket.off("new-message"); 
    };
  }, [session, selectedChat?.id]); // Re-bind if chat changes to ensure ref is fresh

  // JOIN ROOM WHEN CHAT CHANGES
  useEffect(() => {
    const socket = getSocket();
    if (!selectedChat?.id || !socket) return;

    socket.emit('join-chat', selectedChat.id)

    return () => {
      socket.emit('leave-chat', selectedChat.id)
    }
  }, [selectedChat]);

  // SEND MESSAGE (OPTIMISTIC UI)
  const sendMessage = () => {
  const socket = getSocket();
  if (!input.trim() || !socket || !selectedChat?.id) return;

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

  const otherUser = selectedChat.members?.find(
    (m: any) => m.user.id !== session?.user?.id
  )?.user;

  return (
    <div className="h-full flex flex-col">

      {/* HEADER */}
      <div className="p-4 border-b border-white/10 flex items-center gap-3">
        <img
          alt="avatar-img"
          src={otherUser?.image || "/default-avatar.png"}
          className="w-10 h-10 rounded-full"
        />
        <p className="text-white font-medium">
          {otherUser?.name || otherUser?.email}
        </p>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col">
        {messages.length === 0 ? (
          <div className="text-gray-400 text-sm text-center mt-10">
            No messages yet 
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === session?.user?.id;
            return (
              <div
                key={m.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl max-w-[70%] ${
                    isMe
                      ? "bg-blue-600 text-white rounded-tr-none shadow-md"
                      : "bg-gray-800 text-gray-200 rounded-tl-none border border-white/5"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* INPUT */}
      <div className="p-4 flex gap-2 border-t border-white/10">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 p-2 bg-white/5 rounded text-white border border-white/10 focus:border-blue-500 outline-none"
          placeholder="Type message..."
        />
        <button
          onClick={sendMessage}
          className="btn-primary"
        >
          Send
        </button>
      </div>

    </div>
  );
}