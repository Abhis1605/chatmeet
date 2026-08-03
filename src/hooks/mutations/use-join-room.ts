"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { joinRoomByCode } from "@/services/room.service";
import { useChatUIStore } from "@/store/chat-ui-store";
import { showError, showSuccess } from "@/lib/toast";

export function useJoinRoom() {
  const queryClient = useQueryClient();
  const { setActiveRoomChatId } = useChatUIStore();

  return useMutation({
    mutationFn: (roomCode: string) => joinRoomByCode(roomCode),
    onSuccess: (room) => {
      showSuccess("Joined room!");
      setActiveRoomChatId(room.id);
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.room() });
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      showError(error.response?.data?.error ?? "Failed to join room.");
    },
  });
}
