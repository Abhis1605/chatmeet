"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchActiveCall } from "@/services/call.service";

/**
 * useActiveCall — polls for an active call session on a chat.
 * Polling is intentional (v1 does not use socket signaling for calls).
 */
export function useActiveCall(chatId: string | null) {
  return useQuery({
    queryKey: queryKeys.calls.active(chatId!),
    queryFn: () => fetchActiveCall(chatId!),
    enabled: !!chatId,
    refetchInterval: 5000,
  });
}
