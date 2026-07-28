"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { registerUser } from "@/services/auth.service";
import { showError, showSuccess } from "@/lib/toast";

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      registerUser(email, password),

    onSuccess: (data, variables) => {
      if (data.error) {
        showError(data.error);
        return;
      }
      showSuccess("Account created! OTP sent to your email.");
      router.push(`/verify?email=${variables.email}`);
    },

    onError: () => {
      showError("Something went wrong. Please try again.");
    },
  });
}
