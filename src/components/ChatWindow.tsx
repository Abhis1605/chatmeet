"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useChatUIStore } from "@/store/chat-ui-store";
import { useSession } from "next-auth/react";
import ChatHeader from "./chat/ChatHeader";
import MessageList from "./chat/MessageList";
import ChatInput from "./chat/ChatInput";
import ThreadPanel from "./chat/ThreadPanel";
import MessageSearchPanel from "./chat/MessageSearchPanel";
import PinnedMessagesPanel from "./chat/PinnedMessagesPanel";
import ForwardModal from "./chat/ForwardModal";
import { useUploadThing } from "@/lib/uploadthing";
import GroupMembersModal from "./group/GroupMembersModal";
import { canSendGroupMessage } from "@/lib/groupPermissions";
import { showError } from "@/lib/toast";
import { useChats } from "@/hooks/queries/use-chats";
import { useMessages } from "@/hooks/queries/use-messages";
import { usePinnedMessages } from "@/hooks/queries/use-pinned-messages";
import { useSocketContext } from "@/providers/socket-provider";
import { useSendMessage } from "@/hooks/mutations/use-send-message";
import { useMarkAsRead } from "@/hooks/mutations/use-mark-as-read";
import { useToggleReaction } from "@/hooks/mutations/use-toggle-reaction";
import { usePinMessage } from "@/hooks/mutations/use-pin-message";
import { deleteMessage, updateMessage } from "@/services/message.service";
import { toast } from "sonner";
import { useSettings } from "@/hooks/queries/use-settings";

export default function ChatWindow({ onBack }: { onBack?: () => void }) {
  const { activeChatId, activeTab } = useChatUIStore();
  const { data: session } = useSession();

  const { data: chats } = useChats(activeTab);
  const selectedChat = useMemo(
    () => chats?.find((c) => c.id === activeChatId),
    [chats, activeChatId]
  );

  const { socket } = useSocketContext();
  const { data: settings } = useSettings();
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
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [editText, setEditText] = useState("");
  const [messageActionError, setMessageActionError] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [threadMessage, setThreadMessage] = useState<any>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [forwardMessage, setForwardMessage] = useState<any>(null);

  const { data: pinnedMessages = [] } = usePinnedMessages(activeChatId);
  const { mutate: toggleReaction } = useToggleReaction(activeChatId);
  const { mutate: pinMessage } = usePinMessage(activeChatId);

  const { startUpload } = useUploadThing("messageUploader");

  useEffect(() => {
    setReplyTo(null);
    setThreadMessage(null);
    setEditingMessage(null);
    setSearchOpen(false);
    setPinnedOpen(false);
    setForwardMessage(null);
  }, [activeChatId]);

  const selectedChatRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const otherUser = selectedChat?.members?.find(
    (member: any) => member.user.id !== session?.user?.id,
  )?.user;

  // When the other person last read this 1:1 chat; null if receipts are hidden
  const otherReadAt = selectedChat?.isGroup
    ? null
    : selectedChat?.members?.find(
        (member: any) => member.user.id !== session?.user?.id,
      )?.lastReadAt ?? null;
  const otherDeliveredAt = selectedChat?.isGroup
    ? null
    : selectedChat?.members?.find(
        (member: any) => member.user.id !== session?.user?.id,
      )?.lastDeliveredAt ?? null;
  const myLastMessage = [...messages].reverse().find(
    (message) => message.senderId === session?.user?.id
  );
  const groupSeenByCount = selectedChat?.isGroup && myLastMessage
    ? selectedChat.members.filter((member) =>
        member.userId !== session?.user?.id &&
        member.lastReadAt &&
        new Date(member.lastReadAt) >= new Date(myLastMessage.createdAt)
      ).length
    : undefined;
  const groupDeliveredCount = selectedChat?.isGroup && myLastMessage
    ? selectedChat.members.filter((member) =>
        member.userId !== session?.user?.id &&
        member.lastDeliveredAt &&
        new Date(member.lastDeliveredAt) >= new Date(myLastMessage.createdAt)
      ).length
    : undefined;

  const currentMember = selectedChat?.members?.find(
    (member: any) =>
      member.userId === session?.user?.id || member.user?.id === session?.user?.id,
  );

  const canSendMessage = selectedChat?.isGroup
    ? canSendGroupMessage(currentMember)
    : true;

  const draftKey =
    activeChatId && session?.user?.id
      ? `chatmeet:draft:${session.user.id}:${activeChatId}`
      : null;

  useEffect(() => {
    if (!draftKey) {
      setInput("");
      return;
    }
    try {
      setInput(localStorage.getItem(draftKey) ?? "");
    } catch {
      setInput("");
    }
  }, [draftKey]);

  const persistDraft = (value: string) => {
    if (!draftKey) return;
    try {
      if (value) localStorage.setItem(draftKey, value);
      else localStorage.removeItem(draftKey);
    } catch {
      // Drafts are a convenience; ignore storage failures (private mode, quota).
    }
  };

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    if (activeChatId) {
      markAsRead(activeChatId);
    }
    // Re-mark-as-read whenever new messages arrive while this chat stays
    // open, otherwise lastReadAt goes stale and unreadCount creeps back up
    // on the next chat-list refetch.
  }, [activeChatId, messages.length, markAsRead]);

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
      parentId: replyTo?.id,
    });

    setInput("");
    persistDraft("");
    setReplyTo(null);
    socket.emit("stop-typing", selectedChat.id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const beginEditMessage = (message: any) => {
    setEditingMessage(message);
    setEditText(message.content || "");
    setMessageActionError(null);
  };

  const saveEditMessage = async () => {
    if (!selectedChat?.id || !editingMessage || !editText.trim()) return;
    try {
      setMessageActionError(null);
      await updateMessage(selectedChat.id, editingMessage.id, editText.trim());
      setEditingMessage(null);
      setEditText("");
    } catch (error) {
      console.error("Failed to edit message:", error);
      setMessageActionError("Could not edit that message. Please try again.");
    }
  };

  const removeMessage = async (message: any) => {
    if (!selectedChat?.id) return;

    toast("Delete this message?", {
      description: "This cannot be undone.",
      duration: 8000,
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            setMessageActionError(null);
            await deleteMessage(selectedChat.id, message.id);
          } catch (error) {
            console.error("Failed to delete message:", error);
            setMessageActionError("Could not delete that message. Please try again.");
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => undefined,
      },
    });
  };

  const openThread = (message: any) => {
    // Replies always point at their thread root; opening from a reply should
    // still show the whole conversation, not an empty child thread.
    setThreadMessage({ id: message.parentId ?? message.id });
  };

  const handleReact = (message: any, emoji: string) => {
    if (!message?.id || message._isOptimistic) return;
    toggleReaction({ messageId: message.id, emoji });
  };

  const handlePin = (message: any) => {
    if (!message?.id) return;
    const pinned = !message.pinnedAt;
    pinMessage(
      { messageId: message.id, pinned },
      {
        onSuccess: () =>
          toast.success(pinned ? "Message pinned" : "Message unpinned"),
        onError: () => showError("Could not update that pinned message."),
      }
    );
  };

  const jumpToMessage = (messageId: string) => {
    setSearchOpen(false);
    setPinnedOpen(false);

    const attempt = () => {
      const element = document.getElementById(`message-${messageId}`);
      if (!element) return false;
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("ring-2", "ring-primary", "rounded-lg");
      setTimeout(() => {
        element.classList.remove("ring-2", "ring-primary", "rounded-lg");
      }, 2000);
      return true;
    };

    requestAnimationFrame(() => {
      if (!attempt()) {
        setTimeout(() => {
          if (!attempt()) {
            toast("That message is outside the loaded history.");
          }
        }, 80);
      }
    });
  };

  const uploadAndSend = async (file: File) => {
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

      const type = file.type.startsWith("image/")
        ? "IMAGE"
        : file.type.startsWith("video/")
          ? "VIDEO"
          : file.type.startsWith("audio/")
            ? "AUDIO"
            : "FILE";

      sendMessageMutation({
        chatId: selectedChat.id,
        type,
        fileUrl: result.serverData.url,
        fileName: result.name,
        fileType: result.type,
        fileSize: result.size,
        parentId: replyTo?.id,
      });
      setReplyTo(null);
    } catch (error) {
      console.error("Failed to upload file:", error);
      showError("Could not upload that file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleTyping = (value: string) => {
    setInput(value);
    persistDraft(value);

    if (!socket || !socket.connected || !selectedChat?.id) {
      return;
    }

    if (settings?.showTypingIndicator === false) {
      socket.emit("stop-typing", selectedChat.id);
    } else {
      socket.emit("typing", selectedChat.id);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop-typing", selectedChat.id);
    }, 1000);
  };

  if (!selectedChat) {
    return (
      <div className="h-full flex items-center justify-center text-muted">
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
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <ChatHeader
        otherUser={otherUser}
        presenceLabel={presenceLabel}
        isTyping={isTyping}
        chat={selectedChat}
        onManageGroup={() => setOpenGroupMembers(true)}
        onBack={onBack}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenPinned={() => setPinnedOpen(true)}
        pinnedCount={pinnedMessages.length}
        archivedAt={currentMember?.archivedAt}
        mutedUntil={currentMember?.mutedUntil}
      />

      <MessageList
        messages={messages}
        session={session}
        isGroup={Boolean(selectedChat?.isGroup)}
        otherReadAt={otherReadAt}
        otherDeliveredAt={otherDeliveredAt}
        groupSeenByCount={settings?.readReceiptsEnabled === false ? undefined : groupSeenByCount}
        groupDeliveredCount={groupDeliveredCount}
        groupRecipientCount={selectedChat?.isGroup ? Math.max(0, selectedChat.members.length - 1) : undefined}
        onLoadMore={fetchNextPage}
        hasMore={Boolean(hasNextPage)}
        isLoadingMore={isFetchingNextPage}
        onEditMessage={beginEditMessage}
        onDeleteMessage={removeMessage}
        onReplyMessage={setReplyTo}
        onOpenThread={openThread}
        onReact={handleReact}
        onPin={handlePin}
        onForward={setForwardMessage}
      />

      {messageActionError && (
        <p className="border-t border-border bg-surface px-4 py-2 text-xs text-error" role="alert">
          {messageActionError}
        </p>
      )}

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
        {editingMessage && (
          <div className="mb-3 rounded-lg border border-primary/30 bg-surface-soft p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-primary">Editing message</p>
              <button
                type="button"
                onClick={() => setEditingMessage(null)}
                className="text-xs text-muted hover:text-foreground"
              >
                Cancel
              </button>
            </div>
            <div className="flex gap-2">
              <input
                value={editText}
                onChange={(event) => setEditText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void saveEditMessage();
                }}
                className="min-w-0 flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground outline-none focus:border-primary"
                autoFocus
              />
              <button type="button" onClick={() => void saveEditMessage()} className="btn-primary px-4 py-2 text-xs">
                Save
              </button>
            </div>
          </div>
        )}
        <ChatInput
          input={input}
          onChange={handleTyping}
          onSend={sendMessage}
          disabled={!canSendMessage || uploading}
          placeholder={canSendMessage ? "Type a message..." : "Read-only group member"}
          onUpload={uploadAndSend}
          onVoiceNote={uploadAndSend}
        />
      </div>

      <GroupMembersModal
        open={openGroupMembers}
        onClose={() => setOpenGroupMembers(false)}
        chat={selectedChat}
        currentUserId={session?.user?.id}
      />

      <MessageSearchPanel
        open={searchOpen}
        chatId={selectedChat.id}
        onClose={() => setSearchOpen(false)}
        onJumpToMessage={jumpToMessage}
      />

      <PinnedMessagesPanel
        open={pinnedOpen}
        chatId={selectedChat.id}
        onClose={() => setPinnedOpen(false)}
        onJumpToMessage={jumpToMessage}
        onUnpin={handlePin}
        canPin={canSendMessage}
      />

      {forwardMessage && (
        <ForwardModal
          open
          chatId={selectedChat.id}
          message={forwardMessage}
          onClose={() => setForwardMessage(null)}
        />
      )}

      {threadMessage && selectedChat?.id && (
        <ThreadPanel
          chatId={selectedChat.id}
          messageId={threadMessage.id}
          session={session}
          isGroup={Boolean(selectedChat.isGroup)}
          disabled={!canSendMessage}
          onClose={() => setThreadMessage(null)}
          onReact={handleReact}
          onPin={handlePin}
        />
      )}
    </div>
  );
}
