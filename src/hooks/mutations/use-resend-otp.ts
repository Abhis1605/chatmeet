"use client";

import { useMutation } from "@tanstack/react-query";
import { resendOtp } from "@/services/auth.service";
import { showError, showSuccess } from "@/lib/toast";

export function useResendOtp() {
  return useMutation({
    mutationFn: ({ email }: { email: string }) => resendOtp(email),

    onSuccess: (data) => {
      if (data.error) {
        showError(data.error);
        return;
      }
      showSuccess("New OTP sent to your email.");
    },

    onError: () => {
      showError("Failed to resend OTP. Please try again.");
    },
  });
}
