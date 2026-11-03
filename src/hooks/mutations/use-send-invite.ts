"use client";

import { useMutation } from "@tanstack/react-query";
import { sendInvite } from "@/services/invite.service";
import { showError, showSuccess } from "@/lib/toast";

export function useSendInvite() {
  return useMutation({
    mutationFn: ({
      chatId,
      invitedUserId,
      email,
    }: {
      chatId: string;
      invitedUserId?: string;
      email?: string;
    }) => sendInvite(chatId, { invitedUserId, email }),
    onSuccess: (data) => {
      if (data.warning) {
        showError(data.warning);
        return;
      }
      showSuccess(data.emailSent ? "Invite email sent" : "Invite sent");
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      showError(error.response?.data?.error ?? "Failed to send invite.");
    },
  });
}
