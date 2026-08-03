"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { createRoom } from "@/services/room.service";
import { useChatUIStore } from "@/store/chat-ui-store";
import { showError, showSuccess } from "@/lib/toast";

export function useCreateRoom() {
  const queryClient = useQueryClient();
  const { setActiveRoomChatId } = useChatUIStore();

  return useMutation({
    mutationFn: (name: string) => createRoom(name),
    onSuccess: (room) => {
      showSuccess("Room created!");
      setActiveRoomChatId(room.id);
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.room() });
    },
    onError: () => showError("Failed to create room. Please try again."),
  });
}
