"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useChatUIStore } from "@/store/chat-ui-store";
import { useSession } from "next-auth/react";
import ChatHeader from "./chat/ChatHeader";
import MessageList from "./chat/MessageList";
import ChatInput from "./chat/ChatInput";
import { useUploadThing } from "@/lib/uploadthing";
import GroupMembersModal from "./group/GroupMembersModal";
import { canSendGroupMessage } from "@/lib/groupPermissions";
import { showError } from "@/lib/toast";
import { useChats } from "@/hooks/queries/use-chats";
import { useMessages } from "@/hooks/queries/use-messages";
import { useSocketContext } from "@/providers/socket-provider";
import { useSendMessage } from "@/hooks/mutations/use-send-message";
import { useMarkAsRead } from "@/hooks/mutations/use-mark-as-read";

export default function ChatWindow() {
  const { activeChatId, activeTab } = useChatUIStore();
  const { data: session } = useSession();

  const { data: chats } = useChats(activeTab);
  const selectedChat = useMemo(
    () => chats?.find((c) => c.id === activeChatId),
    [chats, activeChatId]
  );

  const { socket } = useSocketContext();
  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(activeChatId);
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
  const [openGroupMembers, setOpenGroupMembers] = useState(false);

  const { startUpload } = useUploadThing("messageUploader");

  const selectedChatRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const otherUser = selectedChat?.members?.find(
    (member: any) => member.user.id !== session?.user?.id,
  )?.user;

  const currentMember = selectedChat?.members?.find(
    (member: any) =>
      member.userId === session?.user?.id || member.user?.id === session?.user?.id,
  );

  const canSendMessage = selectedChat?.isGroup
    ? canSendGroupMessage(currentMember)
    : true;

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    if (activeChatId) {
      markAsRead(activeChatId);
    }
  }, [activeChatId, markAsRead]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedChat?.id) {
      setIsTyping(false);
    }
  }, [selectedChat?.id]);

  useEffect(() => {
    if (!socket || !session) return;

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



    const handleMessageDenied = (data: any) => {
      if (data.chatId === selectedChatRef.current?.id) {
        showError(data.reason || "You do not have permission to message here.");
      }
    };

    socket.on("user-typing", handleUserTyping);
    socket.on("user-stop-typing", handleUserStopTyping);
    socket.on("message-denied", handleMessageDenied);

    return () => {
      socket.off("user-typing", handleUserTyping);
      socket.off("user-stop-typing", handleUserStopTyping);
      socket.off("message-denied", handleMessageDenied);
    };
  }, [socket, session, otherUser?.id]);

  useEffect(() => {
    if (!selectedChat?.id || !socket) return;

    socket.emit("join-chat", selectedChat.id);

    return () => {
      socket.emit("leave-chat", selectedChat.id);
    };
  }, [socket, selectedChat?.id]);

  const sendMessage = () => {
    if (!input.trim() || !socket || !selectedChat?.id) return;
    if (!canSendMessage) {
      showError("Only admins or permitted members can message in this group.");
      return;
    }

    sendMessageMutation({
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
    : otherUser?.isOnline
      ? "Online"
      : otherUser?.lastSeen
        ? `Last seen ${new Intl.DateTimeFormat("en", {
          hour: "numeric",
          minute: "2-digit",
          month: "short",
          day: "numeric",
        }).format(new Date(otherUser.lastSeen))}`
        : "Offline";

  return (
    <div className="h-full flex flex-col">
      <ChatHeader
        otherUser={otherUser}
        presenceLabel={presenceLabel}
        isTyping={isTyping}
        chat={selectedChat}
        onManageGroup={() => setOpenGroupMembers(true)}
      />

      <MessageList
        messages={messages}
        session={session}
        isGroup={Boolean(selectedChat?.isGroup)}
        onLoadMore={fetchNextPage}
        hasMore={Boolean(hasNextPage)}
        isLoadingMore={isFetchingNextPage}
      />

      <div className="p-4 gap-2 border-t border-white/10">
        <ChatInput
          input={input}
          onChange={handleTyping}
          onSend={sendMessage}
          disabled={!canSendMessage || uploading}
          placeholder={canSendMessage ? "Type a message..." : "Read-only group member"}
          onUpload={async (file: File) => {
            if (!socket || !selectedChat?.id) return;
            if (!canSendMessage) {
              showError("Only admins or permitted members can upload in this group.");
              return;
            }

            try {
              setUploading(true);
              const uploaded = await startUpload([file]);

              if (!uploaded?.length) return;
              const result = uploaded[0];

              sendMessageMutation({
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

      <GroupMembersModal
        open={openGroupMembers}
        onClose={() => setOpenGroupMembers(false)}
        chat={selectedChat}
        currentUserId={session?.user?.id}
      />
    </div>
  );
}
