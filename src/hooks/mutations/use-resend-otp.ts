"use client";

import { useMutation } from "@tanstack/react-query";
import { resendOtp } from "@/services/auth.service";
import { showError, showSuccess } from "@/lib/toast";
import { isAxiosError } from "axios";

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

    onError: (error) => {
      const message = isAxiosError<{ error?: string }>(error)
        ? error.response?.data?.error
        : undefined;
      showError(message || "Could not resend the verification code. Please try again.");
    },
  });
}
