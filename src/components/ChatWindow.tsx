"use client";

import { useEffect, useRef, useState } from "react";
import { connectSocket } from "@/lib/socket";
import { useChatStore } from "@/store/useChatStore";
import { useSession } from "next-auth/react";

export default function ChatWindow() {
  const { selectedChat, updateLastMessage } = useChatStore();
  const { data: session } = useSession();

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  const socketRef = useRef<any>(null);
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

  // SOCKET INIT (RUN ONLY ONCE)
  useEffect(() => {
    if (!session) return;

    const token = (session as any).accessToken;
    const socket = connectSocket(token);

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected");
    });

    socket.on('new-message', (msg: any) => {
      if (msg.chatId === selectedChatRef.current?.id) {
        setMessages((prev) => [...prev, msg])
      }

      updateLastMessage(msg)
    })

    return () => {
      socket.off("new-message"); 
      socket.disconnect()
    };
  }, [session]);

  // JOIN ROOM WHEN CHAT CHANGES
  useEffect(() => {
    if (!selectedChat?.id || !socketRef.current) return;

    socketRef.current.emit('join-chat', selectedChat.id)

    return () => {
      socketRef.current.emit('leave-chat', selectedChat.id)
    }
  }, [selectedChat]);

  // SEND MESSAGE (OPTIMISTIC UI)
  const sendMessage = () => {
  if (!input.trim() || !socketRef.current) return;

  socketRef.current.emit("send-message", {
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
      <div className="flex-1 p-4 overflow-y-auto space-y-2">
        {messages.length === 0 ? (
          <div className="text-gray-400 text-sm text-center mt-10">
            No messages yet 
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`px-3 py-2 rounded max-w-xs ${
                m.senderId === session?.user?.id
                  ? "bg-blue-600 ml-auto"
                  : "bg-gray-700"
              }`}
            >
              {m.content}
            </div>
          ))
        )}
      </div>

      {/* INPUT */}
      <div className="p-4 flex gap-2 border-t border-white/10">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-2 rounded text-white"
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