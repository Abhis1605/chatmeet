"use client";

import { useMutation } from "@tanstack/react-query";
import { sendInvite } from "@/services/invite.service";
import { showError, showSuccess } from "@/lib/toast";

export function useSendInvite() {
  return useMutation({
    mutationFn: ({
      chatId,
      invitedUserId,
    }: {
      chatId: string;
      invitedUserId: string;
    }) => sendInvite(chatId, invitedUserId),
    onSuccess: () => showSuccess("Invite sent"),
    onError: (error: { response?: { data?: { error?: string } } }) => {
      showError(error.response?.data?.error ?? "Failed to send invite.");
    },
  });
}
