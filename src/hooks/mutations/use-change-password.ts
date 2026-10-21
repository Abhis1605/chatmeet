"use client";

import { useMutation } from "@tanstack/react-query";
import { signIn, useSession } from "next-auth/react";
import { changePassword } from "@/services/profile.service";
import { getSocket } from "@/lib/socket";
import { showError, showSuccess } from "@/lib/toast";
import type { ChangePasswordRequest } from "@/types/dto/profile.dto";

export function useChangePassword() {
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (payload: ChangePasswordRequest) => {
      const data = await changePassword({ ...payload, socketId: getSocket()?.id });

      // Changing the password signs out every login made before it, including
      // this one. Sign this device straight back in with the new password.
      if (!data.error && session?.user?.email) {
        await signIn("credentials", {
          email: session.user.email,
          password: payload.newPassword,
          redirect: false,
        });
      }

      return data;
    },
    onSuccess: (data) => {
      if (data.error) {
        showError(data.error);
        return;
      }
      showSuccess("Password changed. Other devices have been signed out.");
    },
    onError: () => showError("Failed to change password. Please try again."),
  });
}
