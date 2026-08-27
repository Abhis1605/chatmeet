"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { Socket } from "socket.io-client";
import { connectSocket } from "@/lib/socket";
import { queryKeys } from "@/lib/query-keys";
import type { MessageDto, MessagesPage } from "@/types/dto/message.dto";
import type { ChatDto } from "@/types/dto/chat.dto";
import type { RoomDto } from "@/types/dto/room.dto";
import { useSocketStore } from "@/store/socket-store";
import { useChatUIStore } from "@/store/chat-ui-store";
import { toast } from "sonner";

interface SocketContextValue {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextValue>({ socket: null });

export function useSocketContext() {
  return useContext(SocketContext);
}

export default function SocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);
  const { setConnected } = useSocketStore();
  const accessToken = (session as any)?.accessToken;
  const sessionUserId = session?.user?.id;

  useEffect(() => {
    if (status !== "authenticated" || !accessToken) return;

    const socket = connectSocket(accessToken);
    setSocket(socket);

    // ── Connection status ────────────────────────────────────────────────
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    // ── new-message: append to React Query cache, never Zustand ─────────
    const handleNewMessage = (msg: MessageDto) => {
      // Update messages cache for the specific chat.
      // Pages are cursor-paginated newest-first: pages[0] holds the latest
      // batch, so live messages always append there — older pages (loaded
      // via "load more") are left untouched.
      queryClient.setQueryData<InfiniteData<MessagesPage>>(
        queryKeys.messages.byChat(msg.chatId),
        (prev) => {
          if (!prev || !prev.pages.length) return prev;

          const [firstPage, ...restPages] = prev.pages;

          // Deduplicate: remove any optimistic message with same content+chatId
          const withoutOptimistic = firstPage.messages.filter(
            (m) =>
              !(
                (m as any)._isOptimistic === true &&
                m.content === msg.content &&
                m.chatId === msg.chatId
              )
          );

          // Also deduplicate by real id in case of double-emit
          const alreadyExists = withoutOptimistic.some((m) => m.id === msg.id);
          const messages = alreadyExists
            ? withoutOptimistic
            : [...withoutOptimistic, msg];

          return {
            ...prev,
            pages: [{ ...firstPage, messages }, ...restPages],
          };
        }
      );

      // Check current active chat to decide whether to increment unread count
      const currentActiveChatId = useChatUIStore.getState().activeChatId;
      const currentActiveRoomChatId = useChatUIStore.getState().activeRoomChatId;
      const isUnread =
        currentActiveChatId !== msg.chatId &&
        currentActiveRoomChatId !== msg.chatId &&
        msg.senderId !== sessionUserId;

      // Update last message preview in chat list caches
      for (const type of ["personal", "group"] as const) {
        queryClient.setQueryData<ChatDto[]>(
          queryKeys.chats.list(type),
          (prev) => {
            if (!prev) return prev;
            return prev
              .map((chat) =>
                chat.id === msg.chatId
                  ? {
                    ...chat,
                    lastMessage: {
                      id: msg.id,
                      content: msg.content,
                      senderId: msg.senderId,
                      type: msg.type,
                      createdAt: msg.createdAt
                    },
                    unreadCount: isUnread ? (chat.unreadCount || 0) + 1 : chat.unreadCount,
                    updatedAt: new Date().toISOString(),
                  }
                  : chat
              )
              .sort(
                (a, b) =>
                  new Date(b.updatedAt).getTime() -
                  new Date(a.updatedAt).getTime()
              );
          }
        );
      }

      // Update room list cache
      queryClient.setQueryData<RoomDto[]>(
        queryKeys.chats.room(),
        (prev) => {
          if (!prev) return prev;
          return prev
            .map((room) =>
              room.id === msg.chatId
                ? {
                  ...room,
                  lastMessage: {
                    id: msg.id,
                    content: msg.content,
                    senderId: msg.senderId,
                    type: msg.type,
                    createdAt: msg.createdAt,
                  },
                  unreadCount: isUnread ? (room.unreadCount || 0) + 1 : room.unreadCount,
                  updatedAt: new Date().toISOString(),
                }
                : room
            )
            .sort(
              (a, b) =>
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
        }
      );
    };


    // ── chat-updated: invalidate chat list so it re-fetches ──────────────
    const handleChatUpdated = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
    };

    // ── user-presence-changed: patch isOnline/lastSeen in chat caches ───
    const handlePresenceChanged = (data: {
      userId: string;
      isOnline: boolean;
      lastSeen: string | null;
    }) => {
      for (const type of ["personal", "group"]) {
        queryClient.setQueryData<ChatDto[]>(
          queryKeys.chats.list(type),
          (prev) => {
            if (!prev) return prev;
            return prev.map((chat) => ({
              ...chat,
              members: chat.members.map((member) =>
                member.user.id === data.userId
                  ? {
                    ...member,
                    user: {
                      ...member.user,
                      isOnline: data.isOnline,
                      lastSeen: data.lastSeen,
                    },
                  }
                  : member
              ),
            }));
          }
        );
      }
    };

    // ── user-profile-updated: patch name/avatar in chat + room caches ───
    const handleProfileUpdated = (data: {
      userId: string;
      name: string | null;
      username: string | null;
      image: string | null;
      profilePhotoType: string | null;
      avatarFilename: string | null;
    }) => {
      const patchUser = (user: any) =>
        user.id === data.userId
          ? {
            ...user,
            name: data.name,
            image: data.image,
            profilePhotoType: data.profilePhotoType,
            avatarFilename: data.avatarFilename,
          }
          : user;

      for (const type of ["personal", "group"] as const) {
        queryClient.setQueryData<ChatDto[]>(queryKeys.chats.list(type), (prev) => {
          if (!prev) return prev;
          return prev.map((chat) => ({
            ...chat,
            members: chat.members.map((member) => ({
              ...member,
              user: patchUser(member.user),
            })),
          }));
        });
      }

      queryClient.setQueryData<RoomDto[]>(queryKeys.chats.room(), (prev) => {
        if (!prev) return prev;
        return prev.map((room) => ({
          ...room,
          members: room.members.map((member) => ({
            ...member,
            user: patchUser(member.user),
          })),
        }));
      });

      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    };

    // ── Room events ─────────────────────────────────────────────────────
    const handleRoomMemberJoined = (data: { chatId: string }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.room() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.rooms.members(data.chatId),
      });
    };

    const handleRoomMemberLeft = (data: { chatId: string; userId: string }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.room() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.rooms.members(data.chatId),
      });

      const { activeRoomChatId, setActiveRoomChatId } = useChatUIStore.getState();
      if (activeRoomChatId === data.chatId && data.userId === sessionUserId) {
        setActiveRoomChatId(null);
      }
    };

    const handleRoomInviteReceived = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invites.pending });
    };

    const handleRoomDeleted = (data: { chatId: string }) => {
      queryClient.setQueryData<RoomDto[]>(queryKeys.chats.room(), (prev) => {
        if (!prev) return prev;
        return prev.filter((room) => room.id !== data.chatId);
      });

      const { activeRoomChatId, setActiveRoomChatId } = useChatUIStore.getState();
      if (activeRoomChatId === data.chatId) {
        setActiveRoomChatId(null);
      }
    };

    // ── Call events ─────────────────────────────────────────────────────
    const handleCallIncoming = (data: {
      sessionId: string;
      chatId: string;
      type: string;
      startedByName: string;
    }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calls.active(data.chatId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.calls.history });

      const callType = data.type === "GROUP" ? "Group call" : "Video call";
      toast(`${callType} started by ${data.startedByName}`, {
        description: "Switch to the Video Call tab to join.",
        action: {
          label: "Join",
          onClick: () => {
            // Ideally navigate to video call tab and select this chat.
            // For now, just set active chat.
            useChatUIStore.getState().setActiveChatId(data.chatId);
            useChatUIStore.getState().setActiveTab("personal"); // Or whichever tab makes sense
          },
        },
        duration: 10000,
      });
    };

    const handleCallEnded = (data: { chatId: string }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calls.active(data.chatId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.calls.history });
    };

    socket.on("new-message", handleNewMessage);
    socket.on("chat-updated", handleChatUpdated);
    socket.on("user-presence-changed", handlePresenceChanged);
    socket.on("user-profile-updated", handleProfileUpdated);
    socket.on("room-member-joined", handleRoomMemberJoined);
    socket.on("room-member-left", handleRoomMemberLeft);
    socket.on("room-invite-received", handleRoomInviteReceived);
    socket.on("room-deleted", handleRoomDeleted);
    socket.on("call-incoming", handleCallIncoming);
    socket.on("call-ended", handleCallEnded);

    // ── Tell the server we're gone before the tab actually closes ───────
    // Relying only on the transport close to reach the server is not
    // reliable (especially in incognito windows, which tear the network
    // stack down abruptly), so proactively disconnect on unload as well.
    const handleUnload = () => {
      socket.disconnect();
    };
    window.addEventListener("pagehide", handleUnload);
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("pagehide", handleUnload);
      window.removeEventListener("beforeunload", handleUnload);
      socket.off("connect");
      socket.off("disconnect");
      socket.off("new-message", handleNewMessage);
      socket.off("chat-updated", handleChatUpdated);
      socket.off("user-presence-changed", handlePresenceChanged);
      socket.off("user-profile-updated", handleProfileUpdated);
      socket.off("room-member-joined", handleRoomMemberJoined);
      socket.off("room-member-left", handleRoomMemberLeft);
      socket.off("room-invite-received", handleRoomInviteReceived);
      socket.off("room-deleted", handleRoomDeleted);
      socket.off("call-incoming", handleCallIncoming);
      socket.off("call-ended", handleCallEnded);
    };
  }, [status, accessToken, sessionUserId, queryClient, setConnected]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}
