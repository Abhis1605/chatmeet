"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  updateChatPreferences,
  type ChatPreferencesRequest,
} from "@/services/chat.service";

export function useChatPreferences(chatId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ChatPreferencesRequest) =>
      updateChatPreferences(chatId!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
    },
  });
}
