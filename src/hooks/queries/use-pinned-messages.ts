"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchPinnedMessages } from "@/services/message.service";

export function usePinnedMessages(chatId: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.messages.pinned(chatId ?? ""),
    queryFn: () => fetchPinnedMessages(chatId!),
    enabled: Boolean(chatId) && enabled,
  });
}
