"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchRoomMembers } from "@/services/room.service";

export function useRoomMembers(chatId: string | null) {
  return useQuery({
    queryKey: queryKeys.rooms.members(chatId ?? ""),
    queryFn: () => fetchRoomMembers(chatId!),
    enabled: !!chatId,
  });
}
