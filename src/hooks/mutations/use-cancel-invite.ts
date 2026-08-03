"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { cancelInvite } from "@/services/invite.service";
import { showError, showSuccess } from "@/lib/toast";

export function useCancelInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: string) => cancelInvite(inviteId),
    onSuccess: () => {
      showSuccess("Invite cancelled");
      queryClient.invalidateQueries({ queryKey: queryKeys.invites.pending });
    },
    onError: () => showError("Failed to cancel invite."),
  });
}
