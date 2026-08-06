"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchMessages } from "@/services/message.service";

/**
 * useMessages — fetches messages for a given chat ID, paginated newest-page-first
 * via cursor (oldest loaded message id). Enabled only when chatId is truthy.
 */
export function useMessages(chatId: string | null) {
  return useInfiniteQuery({
    queryKey: queryKeys.messages.byChat(chatId!),
    queryFn: ({ pageParam }) => fetchMessages(chatId!, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!chatId,
  });
}
