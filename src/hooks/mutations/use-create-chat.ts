"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { queryKeys } from "@/lib/query-keys";
import { createDirectChat } from "@/services/chat.service";
import { useChatUIStore } from "@/store/chat-ui-store";
import type { ChatDto } from "@/types/dto/chat.dto";
import { showError } from "@/lib/toast";

/**
 * useCreateChat — creates a direct (personal) chat.
 * Optimistically adds the new chat to the 'personal' list cache,
 * rolls back on error, and invalidates on settle.
 */
export function useCreateChat() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { setActiveChatId } = useChatUIStore();

  return useMutation({
    mutationFn: (targetUserId: string) => {
      if (!session?.user?.id) throw new Error("Not authenticated");
      return createDirectChat(session.user.id, targetUserId);
    },

    onMutate: async () => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({
        queryKey: queryKeys.chats.list("personal"),
      });

      // Snapshot previous value for rollback
      const previousChats = queryClient.getQueryData<ChatDto[]>(
        queryKeys.chats.list("personal")
      );

      return { previousChats };
    },

    onSuccess: (newChat) => {
      if ((newChat as any).error) {
        showError((newChat as any).error || "Could not create chat");
        return;
      }

      // Add to cache (or update if it already exists — API returns existing chat)
      queryClient.setQueryData<ChatDto[]>(
        queryKeys.chats.list("personal"),
        (prev) => {
          if (!prev) return [newChat];
          const exists = prev.find((c) => c.id === newChat.id);
          if (exists) return prev;
          return [newChat, ...prev];
        }
      );

      setActiveChatId(newChat.id);
    },

    onError: (_err, _vars, context) => {
      // Roll back to the snapshot we took before the optimistic update
      if (context?.previousChats !== undefined) {
        queryClient.setQueryData(
          queryKeys.chats.list("personal"),
          context.previousChats
        );
      }
      showError("Failed to create chat. Please try again.");
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chats.list("personal"),
      });
    },
  });
}
