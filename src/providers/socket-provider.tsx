"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { signOut, useSession } from "next-auth/react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { Socket } from "socket.io-client";
import { connectSocket } from "@/lib/socket";
import { queryKeys } from "@/lib/query-keys";
import type { MessageDto, MessagesPage, ThreadPage } from "@/types/dto/message.dto";
import type { ChatDto } from "@/types/dto/chat.dto";
import type { RoomDto } from "@/types/dto/room.dto";
import { useSocketStore } from "@/store/socket-store";
import { useChatUIStore } from "@/store/chat-ui-store";
import { toast } from "sonner";
import type { SettingsDto } from "@/types/dto/settings.dto";
import {
  playNotificationSound,
  primeNotificationSound,
} from "@/lib/notification-sound";

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

    // Browsers only allow audio to start from a user gesture. Prime the
    // AudioContext on the first interaction so later message sounds play.
    window.addEventListener("pointerdown", primeNotificationSound, { once: true });

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

          const nextFirstPage = { ...firstPage, messages };

          if (!msg.parentId || alreadyExists) {
            return {
              ...prev,
              pages: [nextFirstPage, ...restPages],
            };
          }

          // Keep the quoted parent's reply count in sync for the thread link.
          // The parent may live on an older page, so patch every page.
          const bumpCount = (m: MessageDto) =>
            m.id === msg.parentId
              ? {
                  ...m,
                  _count: { replies: (m._count?.replies ?? 0) + 1 },
                }
              : m;

          return {
            ...prev,
            pages: [
              { ...nextFirstPage, messages: nextFirstPage.messages.map(bumpCount) },
              ...restPages.map((page) => ({
                ...page,
                messages: page.messages.map(bumpCount),
              })),
            ],
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

      if (msg.parentId) {
        queryClient.setQueryData<ThreadPage>(
          queryKeys.messages.thread(msg.chatId, msg.parentId),
          (prev) => {
            if (!prev) {
              return prev;
            }
            const replies = prev.replies.filter(
              (reply) =>
                reply.id !== msg.id &&
                !(
                  (reply as MessageDto & { _isOptimistic?: boolean })._isOptimistic &&
                  reply.content === msg.content &&
                  reply.senderId === msg.senderId &&
                  reply.parentId === msg.parentId
                )
            );
            return { ...prev, replies: [...replies, msg] };
          }
        );
      }

      // ── Toast + sound for messages that arrive outside the open chat ──
      if (msg.senderId !== sessionUserId) {
        const settings = queryClient.getQueryData<SettingsDto>(queryKeys.settings.me);
        const muted = settings?.notificationsMuted ?? false;
        const shouldNotify =
          !muted && (isUnread || document.visibilityState !== "visible");

        if (shouldNotify) {
          const roomChats =
            queryClient.getQueryData<RoomDto[]>(queryKeys.chats.room()) ?? [];
          const room = roomChats.find((r) => r.id === msg.chatId);

          let isGroup = false;
          let chatLabel: string | null = null;
          if (room) {
            chatLabel = room.name;
          } else {
            for (const type of ["personal", "group"] as const) {
              const chats =
                queryClient.getQueryData<ChatDto[]>(queryKeys.chats.list(type)) ?? [];
              const chat = chats.find((c) => c.id === msg.chatId);
              if (chat) {
                isGroup = chat.isGroup;
                chatLabel = chat.isGroup ? chat.name : null;
                break;
              }
            }
          }

          const senderName = msg.sender?.name ?? "Someone";
          const title =
            room || isGroup
              ? `${senderName} · ${chatLabel ?? "Chat"}`
              : senderName;
          const preview =
            msg.type === "IMAGE"
              ? "Sent a photo"
              : msg.type === "VIDEO"
                ? "Sent a video"
                : msg.type === "FILE"
                  ? "Sent a file"
                  : (msg.content ?? "New message");

          if (settings?.notificationSound ?? true) {
            playNotificationSound();
          }

          if (settings?.notificationToast ?? true) {
            toast(title, {
              id: `message-${msg.id}`,
              description:
                preview.length > 120 ? `${preview.slice(0, 117)}…` : preview,
              action: {
                label: "Open",
                onClick: () => {
                  const ui = useChatUIStore.getState();
                  if (room) {
                    ui.setActiveRoomChatId(msg.chatId);
                    ui.setActiveTab("room");
                  } else {
                    ui.setActiveChatId(msg.chatId);
                    ui.setActiveTab(isGroup ? "group" : "personal");
                  }
                  ui.setMobilePanel("detail");
                },
              },
              duration: 6000,
            });
          }
        }
      }
    };

    const handleMessageUpdated = (msg: MessageDto) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.threadAll });
      queryClient.setQueryData<InfiniteData<MessagesPage>>(
        queryKeys.messages.byChat(msg.chatId),
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            pages: prev.pages.map((page) => ({
              ...page,
              messages: page.messages.map((message) =>
                message.id === msg.id ? msg : message
              ),
            })),
          };
        }
      );
    };

    const handleMessageDeleted = (data: { id: string; chatId: string }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.threadAll });
      queryClient.setQueryData<InfiniteData<MessagesPage>>(
        queryKeys.messages.byChat(data.chatId),
        (prev) => {
          if (!prev) return prev;

          const deleted = prev.pages
            .flatMap((page) => page.messages)
            .find((message) => message.id === data.id);
          const parentId = deleted?.parentId ?? null;

          const decrement = (message: MessageDto) =>
            parentId && message.id === parentId && message._count
              ? {
                  ...message,
                  _count: { replies: Math.max(0, message._count.replies - 1) },
                }
              : message;

          return {
            ...prev,
            pages: prev.pages.map((page) => ({
              ...page,
              messages: page.messages
                .filter((message) => message.id !== data.id)
                .map(decrement),
            })),
          };
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
      queryClient.setQueryData<any>(queryKeys.profile.me, (prev: any) => {
        if (!prev) return prev;
        const profile = prev.profile ?? prev;
        const updatedProfile = {
          ...profile,
          isOnline: data.isOnline,
          lastSeen: data.lastSeen,
        };
        return prev.profile ? { ...prev, profile: updatedProfile } : updatedProfile;
      });

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

      queryClient.setQueryData<RoomDto[]>(queryKeys.chats.room(), (prev) => {
        if (!prev) return prev;
        return prev.map((room) => ({
          ...room,
          members: room.members.map((member) =>
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
      });
    };

    // ── chat-read: another member read the chat → update "Seen" ─────────
    const handleChatRead = (data: { chatId: string; userId: string; lastReadAt: string }) => {
      // Receipts are mutual: if I turned mine off, I don't see others' either
      const mySettings = queryClient.getQueryData<{ readReceiptsEnabled?: boolean }>(
        queryKeys.settings.me
      );
      if (mySettings?.readReceiptsEnabled === false) return;

      for (const type of ["personal", "group"]) {
        queryClient.setQueryData<ChatDto[]>(queryKeys.chats.list(type), (prev) => {
          if (!prev) return prev;
          return prev.map((chat) =>
            chat.id !== data.chatId
              ? chat
              : {
                  ...chat,
                  members: chat.members.map((member) =>
                    member.userId === data.userId
                      ? { ...member, lastReadAt: data.lastReadAt }
                      : member
                  ),
                }
          );
        });
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
      mediaType?: string;
      startedByName: string;
    }) => {
      const mySettings = queryClient.getQueryData<SettingsDto>(queryKeys.settings.me);
      if (mySettings?.notificationsMuted) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.calls.active(data.chatId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.calls.history });
      if (mySettings?.notificationSound ?? true) playNotificationSound();
      if (mySettings?.notificationToast === false) return;

      const isAudio = data.mediaType === "AUDIO";
      const isGroup = data.type === "GROUP";
      const callType = isAudio
        ? isGroup
          ? "Group voice call"
          : "Voice call"
        : isGroup
          ? "Group video call"
          : "Video call";

      toast(`${callType} started by ${data.startedByName}`, {
        description: "Open the chat and tap Join to enter the call.",
        action: {
          label: "Open",
          onClick: () => {
            const ui = useChatUIStore.getState();
            const rooms =
              queryClient.getQueryData<RoomDto[]>(queryKeys.chats.room()) ?? [];
            const isRoom = rooms.some((room) => room.id === data.chatId);

            if (isRoom) {
              ui.setActiveRoomChatId(data.chatId);
              ui.setActiveTab("room");
            } else {
              ui.setActiveChatId(data.chatId);
              ui.setActiveTab(isGroup ? "group" : "personal");
            }
            ui.setMobilePanel("detail");
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
    socket.on("message-updated", handleMessageUpdated);
    socket.on("message-deleted", handleMessageDeleted);
    socket.on("chat-updated", handleChatUpdated);
    socket.on("user-presence-changed", handlePresenceChanged);
    socket.on("chat-read", handleChatRead);
    socket.on("user-profile-updated", handleProfileUpdated);
    socket.on("room-member-joined", handleRoomMemberJoined);
    socket.on("room-member-left", handleRoomMemberLeft);
    socket.on("room-invite-received", handleRoomInviteReceived);
    socket.on("room-deleted", handleRoomDeleted);
    socket.on("call-incoming", handleCallIncoming);
    socket.on("call-ended", handleCallEnded);

    // ── session-revoked: password was reset/changed on another device ───
    const handleSessionRevoked = () => {
      toast.error("Your password was changed. Please sign in again.");
      void signOut({ callbackUrl: "/login" });
    };
    socket.on("session-revoked", handleSessionRevoked);

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
      window.removeEventListener("pointerdown", primeNotificationSound);
      window.removeEventListener("pagehide", handleUnload);
      window.removeEventListener("beforeunload", handleUnload);
      socket.off("connect");
      socket.off("disconnect");
      socket.off("new-message", handleNewMessage);
      socket.off("message-updated", handleMessageUpdated);
      socket.off("message-deleted", handleMessageDeleted);
      socket.off("chat-updated", handleChatUpdated);
      socket.off("user-presence-changed", handlePresenceChanged);
      socket.off("chat-read", handleChatRead);
      socket.off("user-profile-updated", handleProfileUpdated);
      socket.off("room-member-joined", handleRoomMemberJoined);
      socket.off("room-member-left", handleRoomMemberLeft);
      socket.off("room-invite-received", handleRoomInviteReceived);
      socket.off("room-deleted", handleRoomDeleted);
      socket.off("call-incoming", handleCallIncoming);
      socket.off("call-ended", handleCallEnded);
      socket.off("session-revoked", handleSessionRevoked);
      // Session changes (including logout) must close the transport so the
      // server removes this connection and broadcasts the new presence.
      socket.disconnect();
    };
  }, [status, accessToken, sessionUserId, queryClient, setConnected]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}
