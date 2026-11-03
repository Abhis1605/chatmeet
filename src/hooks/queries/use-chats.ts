"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchChats } from "@/services/chat.service";

/**
 * useChats — fetches the list of chats for the given type ('personal' | 'group').
 * Pass archived=true to fetch the archived inbox instead.
 */
export function useChats(type: string, archived = false) {
  return useQuery({
    queryKey: archived
      ? queryKeys.chats.archived(type)
      : queryKeys.chats.list(type),
    queryFn: () => fetchChats(type, archived),
    enabled: !!type,
  });
}
