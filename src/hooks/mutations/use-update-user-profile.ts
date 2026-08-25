"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { updateProfile } from "@/services/profile.service";
import { showError, showSuccess } from "@/lib/toast";
import type { UpdateProfileRequest } from "@/types/dto/profile.dto";

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfileRequest) => updateProfile(payload),
    onSuccess: (data) => {
      if (data.error) {
        showError(data.error);
        return;
      }
      queryClient.setQueryData(queryKeys.profile.me, data.profile);
      showSuccess("Profile updated");
    },
    onError: () => showError("Failed to update profile. Please try again."),
  });
}
