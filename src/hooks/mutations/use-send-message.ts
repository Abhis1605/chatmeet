"use client";

import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type {
  SendMessagePayload,
  OptimisticMessage,
  MessagesPage,
  ThreadPage,
} from "@/types/dto/message.dto";
import { useSession } from "next-auth/react";
import { showError } from "@/lib/toast";

/**
 * useSendMessage — saves messages through the authenticated API.
 * Optimistically appends a temp message to the cache so UI feels instant.
 */
export function useSendMessage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (payload: SendMessagePayload) => {
      const clientMessageId = crypto.randomUUID();
      const messagePayload = { ...payload, clientMessageId };
      const response = await fetch(`/api/message/${payload.chatId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(messagePayload),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error || "Could not save your message.");
      }
      if (!result?.message) {
        throw new Error("The server did not confirm your message.");
      }
      queryClient.setQueryData<InfiniteData<MessagesPage>>(
        queryKeys.messages.byChat(payload.chatId),
        (previous) => {
          if (!previous) return previous;
          const [firstPage, ...restPages] = previous.pages;
          const withoutTemp = firstPage.messages.filter(
            (message) =>
              !(
                (message as any)._isOptimistic &&
                message.content === (payload.content || null) &&
                message.type === payload.type
              )
          );
          const alreadyExists = withoutTemp.some(
            (message) => message.id === result.message.id
          );
          return {
            ...previous,
            pages: [
              {
                ...firstPage,
                messages: alreadyExists
                  ? withoutTemp
                  : [...withoutTemp, result.message],
              },
              ...restPages,
            ],
          };
        }
      );
      return payload;
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
      void queryClient.invalidateQueries({
        queryKey: queryKeys.messages.byChat(context?.chatId ?? _variables.chatId),
      });
      showError(`Message not confirmed. ${err.message} Check the conversation before retrying.`);
    },
    // We don't invalidate onSettled because the server will push the 'new-message' 
    // event which our SocketProvider handles to dedupe and replace the temp one.
  });
}
