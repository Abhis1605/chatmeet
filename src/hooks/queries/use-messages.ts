"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchMessages } from "@/services/message.service";

/**
 * useMessages — fetches messages for a given chat ID.
 * Enabled only when chatId is truthy.
 */
export function useMessages(chatId: string | null) {
  return useQuery({
    queryKey: queryKeys.messages.byChat(chatId!),
    queryFn: () => fetchMessages(chatId!),
    enabled: !!chatId,
  });
}
