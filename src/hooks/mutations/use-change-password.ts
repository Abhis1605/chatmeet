"use client";

import { useMutation } from "@tanstack/react-query";
import { changePassword } from "@/services/profile.service";
import { showError, showSuccess } from "@/lib/toast";
import type { ChangePasswordRequest } from "@/types/dto/profile.dto";

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordRequest) => changePassword(payload),
    onSuccess: (data) => {
      if (data.error) {
        showError(data.error);
        return;
      }
      showSuccess("Password changed successfully");
    },
    onError: () => showError("Failed to change password. Please try again."),
  });
}
