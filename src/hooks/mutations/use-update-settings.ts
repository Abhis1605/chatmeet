"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { updateSettings } from "@/services/settings.service";
import { showError, showSuccess } from "@/lib/toast";
import type { UpdateSettingsRequest } from "@/types/dto/settings.dto";

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateSettingsRequest) => updateSettings(payload),
    onSuccess: (data, payload) => {
      if (data.error) {
        showError(data.error);
        return;
      }
      queryClient.setQueryData(queryKeys.settings.me, data.settings);
      // Turning read receipts on/off changes which "Seen" data the chat list returns
      if (payload.readReceiptsEnabled !== undefined) {
        queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
      }
      showSuccess("Settings updated");
    },
    onError: () => showError("Failed to update settings. Please try again."),
  });
}
