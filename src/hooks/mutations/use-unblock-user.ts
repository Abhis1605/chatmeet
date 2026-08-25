"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { unblockUser } from "@/services/settings.service";
import { showError, showSuccess } from "@/lib/toast";

export function useUnblockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (blockedId: string) => unblockUser(blockedId),
    onSuccess: (data) => {
      if (data.error) {
        showError(data.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.blockedUsers.all });
      showSuccess("User unblocked");
    },
    onError: () => showError("Failed to unblock user. Please try again."),
  });
}
