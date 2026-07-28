"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useSocketContext } from "@/providers/socket-provider";
import type { SendMessagePayload, OptimisticMessage, MessageDto } from "@/types/dto/message.dto";
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

      const previousMessages = queryClient.getQueryData<MessageDto[]>(
        queryKeys.messages.byChat(payload.chatId)
      );

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
        createdAt: new Date().toISOString(),
        _isOptimistic: true,
      };

      // Append to cache
      queryClient.setQueryData<MessageDto[]>(
        queryKeys.messages.byChat(payload.chatId),
        (prev) => (prev ? [...prev, optimisticMsg] : [optimisticMsg])
      );

      return { previousMessages, chatId: payload.chatId };
    },

    onError: (err, _variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.messages.byChat(context.chatId),
          context.previousMessages
        );
      }
      showError("Failed to send message: " + err.message);
    },
    // We don't invalidate onSettled because the server will push the 'new-message' 
    // event which our SocketProvider handles to dedupe and replace the temp one.
  });
}
