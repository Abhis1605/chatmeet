"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { deleteRoom } from "@/services/room.service";
import { useChatUIStore } from "@/store/chat-ui-store";
import { showError, showSuccess } from "@/lib/toast";

export function useDeleteRoom() {
  const queryClient = useQueryClient();
  const { activeRoomChatId, setActiveRoomChatId } = useChatUIStore();

  return useMutation({
    mutationFn: (chatId: string) => deleteRoom(chatId),
    onSuccess: (_result, chatId) => {
      showSuccess("Room deleted");
      if (activeRoomChatId === chatId) {
        setActiveRoomChatId(null);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.room() });
    },
    onError: () => showError("Failed to delete room."),
  });
}
