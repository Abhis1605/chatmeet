"use client";

import { useMutation } from "@tanstack/react-query";
import { deleteAccount } from "@/services/settings.service";
import { showError } from "@/lib/toast";
import type { DeleteAccountRequest } from "@/types/dto/settings.dto";

export function useDeleteAccount() {
  return useMutation({
    mutationFn: (payload: DeleteAccountRequest) => deleteAccount(payload),
    onError: () => showError("Failed to delete account. Please try again."),
  });
}
