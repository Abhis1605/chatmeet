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
import ThreadPanel from "@/components/chat/ThreadPanel";
import RoomMembersModal from "./RoomMembersModal";
import RoomCodeShareSheet from "./RoomCodeShareSheet";
import CallLauncher from "@/components/call/CallLauncher";
import type { RoomDto } from "@/types/dto/room.dto";
import { useSettings } from "@/hooks/queries/use-settings";

export default function RoomChatWindow({ onBack }: { onBack?: () => void }) {
  const { activeRoomChatId } = useChatUIStore();
  const { data: session } = useSession();
  const { data: rooms = [] } = useRooms();

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === activeRoomChatId) as RoomDto | undefined,
    [rooms, activeRoomChatId]
  );

  const { socket } = useSocketContext();
  const { data: settings } = useSettings();
  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(activeRoomChatId);
  const messages = useMemo(
    () =>
      messagesData
        ? [...messagesData.pages].reverse().flatMap((page) => page.messages)
        : [],
    [messagesData]
  );
  const { mutate: sendMessageMutation } = useSendMessage();
  const { mutate: markAsRead } = useMarkAsRead();

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [openMembers, setOpenMembers] = useState(false);
  const [openShareCode, setOpenShareCode] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [threadMessage, setThreadMessage] = useState<any>(null);

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
    setReplyTo(null);
    setThreadMessage(null);
  }, [activeRoomChatId]);

  useEffect(() => {
    if (activeRoomChatId) {
      markAsRead(activeRoomChatId);
    }
    // Re-mark-as-read whenever new messages arrive while this room stays
    // open, otherwise lastReadAt goes stale and unreadCount creeps back up
    // on the next chat-list refetch.
  }, [activeRoomChatId, messages.length, markAsRead]);

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
      parentId: replyTo?.id,
    });

    setInput("");
    setReplyTo(null);
    socket.emit("stop-typing", selectedRoom.id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const openThread = (message: any) => {
    // Replies always point at their thread root; opening from a reply should
    // still show the whole conversation, not an empty child thread.
    setThreadMessage({ id: message.parentId ?? message.id });
  };

  const handleTyping = (value: string) => {
    setInput(value);

    if (!socket || !socket.connected || !selectedRoom?.id) {
      return;
    }

    if (settings?.showTypingIndicator === false) {
      socket.emit("stop-typing", selectedRoom.id);
    } else {
      socket.emit("typing", selectedRoom.id);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop-typing", selectedRoom.id);
    }, 1000);
  };

  if (!selectedRoom) {
    return (
      <div className="h-full flex items-center justify-center text-muted">
        Select a room
      </div>
    );
  }

  const subtitle = isTyping
    ? "Someone is typing..."
    : `${selectedRoom.members.length} members`;

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <div className="flex min-h-16 items-center gap-2 border-b border-border bg-surface-soft px-3 sm:h-18 sm:gap-3 sm:px-5">
        {onBack && (
          <button type="button" onClick={onBack} aria-label="Back to rooms" className="rounded-md p-2 text-muted hover:bg-surface hover:text-foreground lg:hidden">
            <span aria-hidden="true">←</span>
          </button>
        )}
        <img
          src={selectedRoom.image || "/chatmeet-collapsed-logo.png"}
          alt="room"
          className="w-11 h-11 rounded-full object-cover"
        />

        <div className="flex flex-col flex-1 min-w-0">
          <h3 className="text-foreground font-semibold truncate">{selectedRoom.name}</h3>
          <span
            className={`text-xs transition ${
              isTyping ? "text-primary animate-pulse" : "text-muted"
            }`}
          >
            {subtitle}
          </span>
        </div>

        <CallLauncher chatId={selectedRoom.id} callType="GROUP" />

        <button
          type="button"
          title="Share room code"
          aria-label="Share room code"
          onClick={() => setOpenShareCode(true)}
          className="p-2 rounded-md text-muted hover:bg-surface-soft hover:text-foreground transition cursor-pointer"
        >
          <Hash className="w-5 h-5" />
        </button>

        <button
          type="button"
          title="Room members"
          aria-label="Room members"
          onClick={() => setOpenMembers(true)}
          className="p-2 rounded-md text-muted hover:bg-surface-soft hover:text-foreground transition cursor-pointer"
        >
          <Users className="w-5 h-5" />
        </button>
      </div>

      <MessageList
        messages={messages}
        session={session}
        isGroup
        onLoadMore={fetchNextPage}
        hasMore={Boolean(hasNextPage)}
        isLoadingMore={isFetchingNextPage}
        onReplyMessage={setReplyTo}
        onOpenThread={openThread}
      />

      <div className="p-4 gap-2 border-t border-border">
        {replyTo && (
          <div className="mb-3 flex items-start justify-between gap-3 rounded-lg border border-primary/30 bg-surface-soft px-3 py-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-primary">
                Replying to {replyTo.sender?.name || replyTo.sender?.email}
              </p>
              <p className="truncate text-xs text-muted">
                {replyTo.type === "TEXT"
                  ? replyTo.content
                  : replyTo.type === "IMAGE"
                    ? "Photo"
                    : replyTo.type === "VIDEO"
                      ? "Video"
                      : replyTo.fileName || "File"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="shrink-0 text-xs text-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        )}
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
                parentId: replyTo?.id,
              });
              setReplyTo(null);
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

      {threadMessage && (
        <ThreadPanel
          chatId={selectedRoom.id}
          messageId={threadMessage.id}
          session={session}
          isGroup
          onClose={() => setThreadMessage(null)}
        />
      )}
    </div>
  );
}
