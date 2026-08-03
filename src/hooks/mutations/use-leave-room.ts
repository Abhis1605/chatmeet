"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { leaveRoom } from "@/services/room.service";
import { useChatUIStore } from "@/store/chat-ui-store";
import { showError, showSuccess } from "@/lib/toast";

export function useLeaveRoom() {
  const queryClient = useQueryClient();
  const { activeRoomChatId, setActiveRoomChatId } = useChatUIStore();

  return useMutation({
    mutationFn: (chatId: string) => leaveRoom(chatId),
    onSuccess: (_result, chatId) => {
      showSuccess("Left room");
      if (activeRoomChatId === chatId) {
        setActiveRoomChatId(null);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.room() });
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      showError(error.response?.data?.error ?? "Failed to leave room.");
    },
  });
}
