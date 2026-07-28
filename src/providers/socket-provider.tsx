"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
} from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { Socket } from "socket.io-client";
import { connectSocket, getSocket } from "@/lib/socket";
import { queryKeys } from "@/lib/query-keys";
import type { MessageDto } from "@/types/dto/message.dto";
import type { ChatDto } from "@/types/dto/chat.dto";
import { useSocketStore } from "@/store/socket-store";
import { useChatUIStore } from "@/store/chat-ui-store";

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
  const socketRef = useRef<Socket | null>(null);
  const { setConnected } = useSocketStore();

  useEffect(() => {
    if (status !== "authenticated" || !session) return;

    const token = (session as any).accessToken;
    const socket = connectSocket(token);
    socketRef.current = socket;

    // ── Connection status ────────────────────────────────────────────────
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    // ── new-message: append to React Query cache, never Zustand ─────────
    const handleNewMessage = (msg: MessageDto) => {
      // Update messages cache for the specific chat
      queryClient.setQueryData<MessageDto[]>(
        queryKeys.messages.byChat(msg.chatId),
        (prev) => {
          if (!prev) return [msg];

          // Deduplicate: remove any optimistic message with same content+chatId
          const withoutOptimistic = prev.filter(
            (m) =>
              !(
                (m as any)._isOptimistic === true &&
                m.content === msg.content &&
                m.chatId === msg.chatId
              )
          );

          // Also deduplicate by real id in case of double-emit
          const alreadyExists = withoutOptimistic.some((m) => m.id === msg.id);
          if (alreadyExists) return withoutOptimistic;

          return [...withoutOptimistic, msg];
        }
      );

      // Check current active chat to decide whether to increment unread count
      const currentActiveChatId = useChatUIStore.getState().activeChatId;
      const isUnread = currentActiveChatId !== msg.chatId;

      // Update last message preview in both chat list caches
      for (const type of ["personal", "group"]) {
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

    socket.on("new-message", handleNewMessage);
    socket.on("chat-updated", handleChatUpdated);
    socket.on("user-presence-changed", handlePresenceChanged);

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("new-message", handleNewMessage);
      socket.off("chat-updated", handleChatUpdated);
      socket.off("user-presence-changed", handlePresenceChanged);
    };
  }, [status, session, queryClient, setConnected]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
}
