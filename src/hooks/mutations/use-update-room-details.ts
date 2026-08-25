"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { updateRoomDetails } from "@/services/room.service";
import type { RoomDto } from "@/types/dto/room.dto";
import type { UpdateChatDetailsRequest } from "@/types/dto/chat.dto";
import { showError, showSuccess } from "@/lib/toast";

export function useUpdateRoomDetails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId, ...body }: { chatId: string } & UpdateChatDetailsRequest) =>
      updateRoomDetails(chatId, body),

    onSuccess: (updatedRoom) => {
      queryClient.setQueryData<RoomDto[]>(queryKeys.chats.room(), (prev) => {
        if (!prev) return prev;
        return prev.map((room) => (room.id === updatedRoom.id ? updatedRoom : room));
      });
      showSuccess("Room updated");
    },

    onError: () => showError("Failed to update room"),
  });
}
