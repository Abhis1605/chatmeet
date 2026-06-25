"use client";

import { useEffect, useRef, useState } from "react";
import { connectSocket } from "@/lib/socket";
import { useChatStore } from "@/store/useChatStore";
import { useSession } from "next-auth/react";
import { Socket } from "socket.io-client";
import FileUploadButton from "./FileUploadButton";

export default function ChatWindow() {
  const { selectedChat, updateLastMessage } = useChatStore();
  const { data: session } = useSession();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserPresence, setOtherUserPresence] = useState<{
    isOnline?: boolean;
    lastSeen?: string | null;
  }>({});

  const selectedChatRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const otherUser = selectedChat?.members?.find(
    (member: any) => member.user.id !== session?.user?.id,
  )?.user;

  useEffect(() => {
    if (!session) return;

    const token = (session as any).accessToken;
    setSocket(connectSocket(token));
  }, [session]);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    setOtherUserPresence({
      isOnline: otherUser?.isOnline,
      lastSeen: otherUser?.lastSeen,
    });
  }, [otherUser?.id, otherUser?.isOnline, otherUser?.lastSeen]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedChat?.id) return;

    setMessages([]);
    setIsTyping(false);

    const fetchMessages = async () => {
      const res = await fetch(`/api/message/${selectedChat.id}`);
      const data = await res.json();
      setMessages(data);
    };

    fetchMessages();
  }, [selectedChat]);

  useEffect(() => {
    if (!socket || !session) return;

    const handleNewMessage = (msg: any) => {
      if (msg.chatId === selectedChatRef.current?.id) {
        setMessages((prev) => [...prev, msg]);
      }

      updateLastMessage(msg);
    };

    const handleUserTyping = (data: any) => {
      if (data.userId !== session?.user?.id && selectedChatRef.current?.id) {
        setIsTyping(true);
      }
    };

    const handleUserStopTyping = (data: any) => {
      if (data.userId !== session?.user?.id && selectedChatRef.current?.id) {
        setIsTyping(false);
      }
    };

    const handlePresenceChanged = (data: any) => {
      if (data.userId === otherUser?.id) {
        setOtherUserPresence({
          isOnline: data.isOnline,
          lastSeen: data.lastSeen,
        });
      }
    };

    socket.on("new-message", handleNewMessage);
    socket.on("user-typing", handleUserTyping);
    socket.on("user-stop-typing", handleUserStopTyping);
    socket.on("user-presence-changed", handlePresenceChanged);

    return () => {
      socket.off("new-message", handleNewMessage);
      socket.off("user-typing", handleUserTyping);
      socket.off("user-stop-typing", handleUserStopTyping);
      socket.off("user-presence-changed", handlePresenceChanged);
    };
  }, [socket, session, updateLastMessage, otherUser?.id]);

  useEffect(() => {
    if (!selectedChat?.id || !socket) return;

    socket.emit("join-chat", selectedChat.id);

    return () => {
      socket.emit("leave-chat", selectedChat.id);
    };
  }, [socket, selectedChat?.id]);

  const sendMessage = () => {
    if (!input.trim() || !socket || !selectedChat?.id) return;

    socket.emit("send-message", {
      chatId: selectedChat.id,
      type: "TEXT",
      content: input,
    });

    setInput("");
    socket.emit("stop-typing", selectedChat.id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    if (!socket || !socket.connected || !selectedChat?.id) {
      return;
    }

    socket.emit("typing", selectedChat.id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop-typing", selectedChat.id);
    }, 1000);
  };

  if (!selectedChat) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        Select a chat
      </div>
    );
  }

  const presenceLabel = isTyping
    ? "Typing..."
    : otherUserPresence.isOnline
      ? "Online"
      : otherUserPresence.lastSeen
        ? `Last seen ${new Intl.DateTimeFormat("en", {
            hour: "numeric",
            minute: "2-digit",
            month: "short",
            day: "numeric",
          }).format(new Date(otherUserPresence.lastSeen))}`
        : "Offline";

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-white/10 flex items-center gap-3">
        <img
          alt="avatar-img"
          src={otherUser?.image || "/default-avatar.png"}
          className="w-10 h-10 rounded-full"
        />
        <div className="flex flex-col">
          <p className="text-white font-medium">
            {otherUser?.name || otherUser?.email}
          </p>
          <span
            className={`text-xs ${
              isTyping ? "text-green-400 animate-pulse" : "text-gray-400"
            }`}
          >
            {presenceLabel}
          </span>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col">
        {messages.length === 0 ? (
          <div className="text-gray-400 text-sm text-center mt-10">
            No messages yet
          </div>
        ) : (
          messages.map((message) => {
            const isMe = message.senderId === session?.user?.id;

            return (
              <div
                key={message.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl max-w-[70%] ${
                    isMe
                      ? "bg-blue-600 text-white rounded-tr-none shadow-md"
                      : "bg-gray-800 text-gray-200 rounded-tl-none border border-white/5"
                  }`}
                >
                  <>
                    {message.type === "TEXT" && <p>{message.content}</p>}
                    {
                        message.type === 'IMAGE' && (
                            <img src={message.fileUrl} alt={message.fileName} />
                        )
                    }

                    {
                        message.type === 'FILE' && (
                            <a href={message.fileUrl} target="_blank" rel="noopener noreferrer">
                                📄 {message.fileName}
                            </a>
                        )
                    }
                  </>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 flex gap-2 border-t border-white/10">
        <FileUploadButton
          onUploadComplete={(file) => {
            if (!socket || !selectedChat?.id) return;

            socket.emit("send-message", {
              chatId: selectedChat.id,

              type: file.type.startsWith("image/") ? "IMAGE" : "FILE",

              fileUrl: file.ufsUrl,
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
            });
          }}
        />
        <input
          value={input}
          onChange={handleTyping}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 p-2 bg-white/5 rounded text-white border border-white/10 focus:border-blue-500 outline-none"
          placeholder="Type message..."
        />
        <button onClick={sendMessage} className="btn-primary">
          Send
        </button>
      </div>
    </div>
  );
}
