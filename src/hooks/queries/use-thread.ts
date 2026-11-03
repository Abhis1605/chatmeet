"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchThread } from "@/services/message.service";

export function useThread(chatId: string, messageId: string | null) {
  return useQuery({
    queryKey: queryKeys.messages.thread(chatId, messageId ?? ""),
    queryFn: () => fetchThread(chatId, messageId!),
    enabled: Boolean(chatId && messageId),
  });
}
