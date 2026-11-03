"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { forwardMessage } from "@/services/message.service";

export function useForwardMessage(chatId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
      targetChatIds,
    }: {
      messageId: string;
      targetChatIds: string[];
    }) => forwardMessage(chatId!, messageId, targetChatIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
    },
  });
}
