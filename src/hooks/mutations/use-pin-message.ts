"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { updateMessageInCache } from "@/lib/message-cache";
import { pinMessage } from "@/services/message.service";

export function usePinMessage(chatId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
      pinned,
    }: {
      messageId: string;
      pinned: boolean;
    }) => pinMessage(chatId!, messageId, pinned),
    onSuccess: (message) => {
      if (!chatId) return;
      updateMessageInCache(queryClient, chatId, message.id, () => message);
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.pinned(chatId) });
    },
  });
}
