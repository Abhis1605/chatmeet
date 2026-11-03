"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchRooms } from "@/services/room.service";

export function useRooms(archived = false) {
  return useQuery({
    queryKey: archived ? queryKeys.chats.archived("room") : queryKeys.chats.room(),
    queryFn: () => fetchRooms(archived),
  });
}
