"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { setRoomCodeActive } from "@/services/room.service";
import type { RoomDto } from "@/types/dto/room.dto";
import { showError, showSuccess } from "@/lib/toast";

export function useToggleCodeActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId, active }: { chatId: string; active: boolean }) =>
      setRoomCodeActive(chatId, active),
    onSuccess: (result, { chatId }) => {
      showSuccess(result.roomCodeActive ? "Room code enabled" : "Room code disabled");
      queryClient.setQueryData<RoomDto[]>(queryKeys.chats.room(), (prev) => {
        if (!prev) return prev;
        return prev.map((room) =>
          room.id === chatId ? { ...room, roomCodeActive: result.roomCodeActive } : room
        );
      });
    },
    onError: () => showError("Failed to update room code status."),
  });
}
