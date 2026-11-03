"use client";

import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useSocketContext } from "@/providers/socket-provider";
import type {
  SendMessagePayload,
  OptimisticMessage,
  MessagesPage,
  ThreadPage,
} from "@/types/dto/message.dto";
import { useSession } from "next-auth/react";
import { showError } from "@/lib/toast";

/**
 * useSendMessage — wraps socket emit, NOT an axios call.
 * Optimistically appends a temp message to the cache so UI feels instant.
 */
export function useSendMessage() {
  const queryClient = useQueryClient();
  const { socket } = useSocketContext();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (payload: SendMessagePayload) => {
      if (!socket || !socket.connected) {
        throw new Error("Socket disconnected");
      }
      // Emit via socket (no HTTP response to wait for)
      socket.emit("send-message", payload);
      
      // We resolve immediately because the actual server confirmation comes back 
      // via the 'new-message' event in SocketProvider.
      return Promise.resolve(payload);
    },

    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.messages.byChat(payload.chatId),
      });

      const previousMessages = queryClient.getQueryData<InfiniteData<MessagesPage>>(
        queryKeys.messages.byChat(payload.chatId)
      );

      const cachedMessages =
        previousMessages?.pages.flatMap((page) => page.messages) ?? [];
      const findMessage = (id: string) =>
        cachedMessages.find((message) => message.id === id);
      const quotedMessage = payload.parentId
        ? findMessage(payload.parentId)
        : undefined;
      const threadRoot = quotedMessage?.parentId
        ? (findMessage(quotedMessage.parentId) ?? quotedMessage)
        : quotedMessage;

      // Create optimistic message
      const optimisticMsg: OptimisticMessage = {
        id: `temp-${Date.now()}`,
        chatId: payload.chatId,
        content: payload.content || null,
        type: payload.type,
        fileUrl: payload.fileUrl || null,
        fileName: payload.fileName || null,
        fileType: payload.fileType || null,
        fileSize: payload.fileSize || null,
        senderId: session?.user?.id || "",
        sender: session?.user as any,
        parentId: threadRoot?.id ?? null,
        parent: threadRoot
          ? {
              id: threadRoot.id,
              content: threadRoot.content,
              type: threadRoot.type,
              fileName: threadRoot.fileName,
              senderId: threadRoot.senderId,
              sender: threadRoot.sender,
              createdAt: threadRoot.createdAt,
            }
          : null,
        createdAt: new Date().toISOString(),
        _isOptimistic: true,
      };

      // Append to the newest page of the cache
      queryClient.setQueryData<InfiniteData<MessagesPage>>(
        queryKeys.messages.byChat(payload.chatId),
        (prev) => {
          if (!prev || !prev.pages.length) return prev;
          const [firstPage, ...restPages] = prev.pages;
          return {
            ...prev,
            pages: [
              { ...firstPage, messages: [...firstPage.messages, optimisticMsg] },
              ...restPages,
            ],
          };
        }
      );

      const threadKey = threadRoot
        ? queryKeys.messages.thread(payload.chatId, threadRoot.id)
        : null;
      const previousThread = threadKey
        ? queryClient.getQueryData<ThreadPage>(threadKey)
        : undefined;

      if (threadKey && previousThread) {
        queryClient.setQueryData<ThreadPage>(threadKey, (prev) => {
          if (!prev || prev.replies.some((reply) => reply.id === optimisticMsg.id)) {
            return prev;
          }
          return { ...prev, replies: [...prev.replies, optimisticMsg] };
        });
      }

      return {
        previousMessages,
        previousThread,
        threadKey,
        chatId: payload.chatId,
      };
    },

    onError: (err, _variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.messages.byChat(context.chatId),
          context.previousMessages
        );
      }
      if (context?.threadKey && context.previousThread) {
        queryClient.setQueryData(context.threadKey, context.previousThread);
      }
      showError("Failed to send message: " + err.message);
    },
    // We don't invalidate onSettled because the server will push the 'new-message' 
    // event which our SocketProvider handles to dedupe and replace the temp one.
  });
}
