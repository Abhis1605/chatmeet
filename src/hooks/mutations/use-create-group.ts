"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { createGroupChat } from "@/services/chat.service";
import { useChatUIStore } from "@/store/chat-ui-store";
import { showError, showSuccess } from "@/lib/toast";

/**
 * useCreateGroup — creates a group chat.
 * Invalidates the 'group' chat list on success.
 */
export function useCreateGroup() {
  const queryClient = useQueryClient();
  const { setActiveChatId } = useChatUIStore();

  return useMutation({
    mutationFn: ({ name, memberIds }: { name: string; memberIds: string[] }) =>
      createGroupChat(name, memberIds),

    onSuccess: (newGroup) => {
      if ((newGroup as any).error) {
        showError((newGroup as any).error || "Could not create group");
        return;
      }

      showSuccess("Group created!");
      setActiveChatId(newGroup.id);

      queryClient.invalidateQueries({
        queryKey: queryKeys.chats.list("group"),
      });
    },

    onError: () => {
      showError("Failed to create group. Please try again.");
    },
  });
}
