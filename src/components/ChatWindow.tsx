"use client";

import { useEffect, useRef, useState } from "react";
import { connectSocket } from "@/lib/socket";
import { useChatStore } from "@/store/useChatStore";
import { useSession } from "next-auth/react";
import { Socket } from "socket.io-client";
import ChatHeader from "./chat/ChatHeader";
import MessageList from "./chat/MessageList";
import ChatInput from "./chat/ChatInput";
import { useUploadThing } from "@/lib/uploadthing";

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
  const [uploading, setUploading] = useState(false);

  const { startUpload } = useUploadThing("messageUploader");

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
      <ChatHeader
        otherUser={otherUser}
        presenceLabel={presenceLabel}
        isTyping={isTyping}
      />

      <MessageList messages={messages} session={session} />

      <div className="p-4  gap-2 border-t border-white/10">
        <ChatInput
          input={input}
          onChange={handleTyping}
          onSend={sendMessage}
          onUpload={async (file: File) => {
            if (!socket || !selectedChat?.id) return;

            try {
              setUploading(true);

              const uploaded = await startUpload([file]);

              if (!uploaded?.length) return;

              const result = uploaded[0];

              socket.emit("send-message", {
                chatId: selectedChat.id,
                type: file.type.startsWith("image/") ? "IMAGE" : "FILE",
                fileUrl: result.serverData.url,
                fileName: result.name,
                fileType: result.type,
                fileSize: result.size,
              });
            } finally {
              setUploading(false);
            }
          }}
        />
      </div>
    </div>
  );
}
