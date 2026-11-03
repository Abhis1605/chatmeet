"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useDebounce } from "@/hooks/useDebounce";
import { searchMessages } from "@/services/message.service";

export function useMessageSearch(chatId: string | null, query: string) {
  const debounced = useDebounce(query.trim(), 300);

  return useQuery({
    queryKey: queryKeys.messages.search(chatId ?? "", debounced),
    queryFn: () => searchMessages(chatId!, debounced),
    enabled: Boolean(chatId) && debounced.length >= 2,
    staleTime: 30_000,
  });
}
