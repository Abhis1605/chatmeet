"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { verifyOtp } from "@/services/auth.service";
import { showError, showSuccess } from "@/lib/toast";

export function useVerifyOtp() {
  const router = useRouter();

  return useMutation({
    mutationFn: ({
      email,
      otp,
    }: {
      email: string;
      otp: string;
      callbackUrl?: string;
    }) => verifyOtp(email, otp),

    onSuccess: (data, variables) => {
      if (data.error) {
        showError(data.error);
        return;
      }
      showSuccess("Email verified successfully!");
      router.push(
        variables.callbackUrl
          ? `/login?callbackUrl=${encodeURIComponent(variables.callbackUrl)}`
          : "/login"
      );
    },

    onError: () => {
      showError("Verification failed. Please try again.");
    },
  });
}
