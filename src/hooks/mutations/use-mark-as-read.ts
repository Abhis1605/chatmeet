"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markChatAsRead } from "@/services/chat.service";
import { queryKeys } from "@/lib/query-keys";
import type { ChatDto } from "@/types/dto/chat.dto";

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chatId: string) => markChatAsRead(chatId),
    onMutate: (chatId) => {
      // Optimistically zero out unreadCount in the cache
      for (const type of ["personal", "group"]) {
        for (const key of [
          queryKeys.chats.list(type),
          queryKeys.chats.archived(type),
        ]) {
          queryClient.setQueryData<ChatDto[]>(key, (prev) => {
            if (!prev) return prev;
            return prev.map((chat) =>
              chat.id === chatId
                ? { ...chat, unreadCount: 0, mentionCount: 0 }
                : chat
            );
          });
        }
      }
    },
    // We don't necessarily need to rollback on error or invalidate because it's just a read receipt, 
    // but we can let it silently fail or retry.
  });
}
