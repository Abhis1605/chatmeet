"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchChats } from "@/services/chat.service";

/**
 * useChats — fetches the list of chats for the given type ('personal' | 'group').
 * Keyed by queryKeys.chats.list(type) — invalidated by SocketProvider on 'chat-updated'.
 */
export function useChats(type: string) {
  return useQuery({
    queryKey: queryKeys.chats.list(type),
    queryFn: () => fetchChats(type),
    enabled: !!type,
  });
}
