"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { regenerateRoomCode } from "@/services/room.service";
import type { RoomDto } from "@/types/dto/room.dto";
import { showError, showSuccess } from "@/lib/toast";

export function useRegenerateCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chatId: string) => regenerateRoomCode(chatId),
    onSuccess: (result, chatId) => {
      showSuccess("Room code regenerated");
      queryClient.setQueryData<RoomDto[]>(queryKeys.chats.room(), (prev) => {
        if (!prev) return prev;
        return prev.map((room) =>
          room.id === chatId
            ? { ...room, roomCode: result.roomCode, roomCodeActive: true }
            : room
        );
      });
    },
    onError: () => showError("Failed to regenerate code."),
  });
}
