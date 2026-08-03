"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchRooms } from "@/services/room.service";

export function useRooms() {
  return useQuery({
    queryKey: queryKeys.chats.room(),
    queryFn: fetchRooms,
  });
}
