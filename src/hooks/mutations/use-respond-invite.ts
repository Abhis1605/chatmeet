"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { respondToInvite } from "@/services/invite.service";
import { useChatUIStore } from "@/store/chat-ui-store";
import { showError, showSuccess } from "@/lib/toast";

export function useRespondInvite() {
  const queryClient = useQueryClient();
  const { setActiveRoomChatId } = useChatUIStore();

  return useMutation({
    mutationFn: ({
      inviteId,
      action,
      chatId,
    }: {
      inviteId: string;
      action: "accept" | "reject";
      chatId?: string;
    }) => respondToInvite(inviteId, action),
    onSuccess: (_result, { action, chatId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invites.pending });
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.room() });

      if (action === "accept") {
        showSuccess("Invite accepted");
        if (chatId) {
          setActiveRoomChatId(chatId);
        }
      } else {
        showSuccess("Invite declined");
      }
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      showError(error.response?.data?.error ?? "Failed to respond to invite.");
    },
  });
}
