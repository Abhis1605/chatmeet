"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Hash, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { useChatUIStore } from "@/store/chat-ui-store";
import { useRooms } from "@/hooks/queries/use-rooms";
import { useMessages } from "@/hooks/queries/use-messages";
import { useSocketContext } from "@/providers/socket-provider";
import { useSendMessage } from "@/hooks/mutations/use-send-message";
import { useMarkAsRead } from "@/hooks/mutations/use-mark-as-read";
import { useUploadThing } from "@/lib/uploadthing";
import { showError } from "@/lib/toast";
import MessageList from "@/components/chat/MessageList";
import ChatInput from "@/components/chat/ChatInput";
import RoomMembersModal from "./RoomMembersModal";
import RoomCodeShareSheet from "./RoomCodeShareSheet";
import type { RoomDto } from "@/types/dto/room.dto";

export default function RoomChatWindow() {
  const { activeRoomChatId } = useChatUIStore();
  const { data: session } = useSession();
  const { data: rooms = [] } = useRooms();

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === activeRoomChatId) as RoomDto | undefined,
    [rooms, activeRoomChatId]
  );

  const { socket } = useSocketContext();
  const { data: messages = [] } = useMessages(activeRoomChatId);
  const { mutate: sendMessageMutation } = useSendMessage();
  const { mutate: markAsRead } = useMarkAsRead();

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [openMembers, setOpenMembers] = useState(false);
  const [openShareCode, setOpenShareCode] = useState(false);

  const { startUpload } = useUploadThing("messageUploader");

  const selectedRoomRef = useRef<RoomDto | undefined>(undefined);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentMember = selectedRoom?.members.find(
    (member) =>
      member.userId === session?.user?.id || member.user?.id === session?.user?.id
  );
  const isCreator = currentMember?.role === "CREATOR";

  useEffect(() => {
    selectedRoomRef.current = selectedRoom;
  }, [selectedRoom]);

  useEffect(() => {
    if (activeRoomChatId) {
      markAsRead(activeRoomChatId);
    }
  }, [activeRoomChatId, markAsRead]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedRoom?.id) {
      setIsTyping(false);
    }
  }, [selectedRoom?.id]);

  useEffect(() => {
    if (!socket || !session) return;

    const handleUserTyping = (data: { userId?: string }) => {
      if (data.userId !== session.user?.id && selectedRoomRef.current?.id) {
        setIsTyping(true);
      }
    };

    const handleUserStopTyping = (data: { userId?: string }) => {
      if (data.userId !== session.user?.id && selectedRoomRef.current?.id) {
        setIsTyping(false);
      }
    };

    socket.on("user-typing", handleUserTyping);
    socket.on("user-stop-typing", handleUserStopTyping);

    return () => {
      socket.off("user-typing", handleUserTyping);
      socket.off("user-stop-typing", handleUserStopTyping);
    };
  }, [socket, session]);

  useEffect(() => {
    if (!selectedRoom?.id || !socket) return;

    socket.emit("join-chat", selectedRoom.id);

    return () => {
      socket.emit("leave-chat", selectedRoom.id);
    };
  }, [socket, selectedRoom?.id]);

  const sendMessage = () => {
    if (!input.trim() || !socket || !selectedRoom?.id) return;

    sendMessageMutation({
      chatId: selectedRoom.id,
      type: "TEXT",
      content: input,
    });

    setInput("");
    socket.emit("stop-typing", selectedRoom.id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    if (!socket || !socket.connected || !selectedRoom?.id) {
      return;
    }

    socket.emit("typing", selectedRoom.id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop-typing", selectedRoom.id);
    }, 1000);
  };

  if (!selectedRoom) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        Select a room
      </div>
    );
  }

  const subtitle = isTyping
    ? "Someone is typing..."
    : `${selectedRoom.members.length} members`;

  return (
    <div className="h-full flex flex-col">
      <div className="h-18 px-5 border-b border-white/10 flex items-center gap-3 bg-[#0f172a]">
        <img
          src="/chatmeet-collapsed-logo.png"
          alt="room"
          className="w-11 h-11 rounded-full object-cover"
        />

        <div className="flex flex-col flex-1 min-w-0">
          <h3 className="text-white font-semibold truncate">{selectedRoom.name}</h3>
          <span
            className={`text-xs transition ${
              isTyping ? "text-green-400 animate-pulse" : "text-gray-400"
            }`}
          >
            {subtitle}
          </span>
        </div>

        <button
          type="button"
          title="Share room code"
          aria-label="Share room code"
          onClick={() => setOpenShareCode(true)}
          className="p-2 rounded-md text-gray-400 hover:bg-white/10 hover:text-white transition"
        >
          <Hash className="w-5 h-5" />
        </button>

        <button
          type="button"
          title="Room members"
          aria-label="Room members"
          onClick={() => setOpenMembers(true)}
          className="p-2 rounded-md text-gray-400 hover:bg-white/10 hover:text-white transition"
        >
          <Users className="w-5 h-5" />
        </button>
      </div>

      <MessageList messages={messages} session={session} isGroup />

      <div className="p-4 gap-2 border-t border-white/10">
        <ChatInput
          input={input}
          onChange={handleTyping}
          onSend={sendMessage}
          disabled={uploading}
          placeholder="Type a message..."
          onUpload={async (file: File) => {
            if (!socket || !selectedRoom?.id) return;

            try {
              setUploading(true);
              const uploaded = await startUpload([file]);

              if (!uploaded?.length) return;
              const result = uploaded[0];

              sendMessageMutation({
                chatId: selectedRoom.id,
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

      <RoomMembersModal
        open={openMembers}
        onClose={() => setOpenMembers(false)}
        room={selectedRoom}
        currentUserId={session?.user?.id}
      />

      <RoomCodeShareSheet
        open={openShareCode}
        onClose={() => setOpenShareCode(false)}
        room={selectedRoom}
        isCreator={Boolean(isCreator)}
      />
    </div>
  );
}
