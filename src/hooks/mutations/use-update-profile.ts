"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile } from "@/services/user.service";
import { showError, showSuccess } from "@/lib/toast";

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, name, image }: { email: string; name?: string; image?: string }) =>
      updateProfile(email, name, image),

    onSuccess: (data) => {
      if ((data as any).error) {
        showError((data as any).error || "Could not update profile");
        return;
      }
      showSuccess("Profile updated successfully");
      
      // We don't have a specific "me" query to invalidate since session handles the active user,
      // but if we did, we'd invalidate it here. For NextAuth, the user might need to log out/in 
      // or we can refresh the page, but NextAuth session update isn't strictly necessary if it's just DB.
    },

    onError: () => {
      showError("Failed to update profile. Please try again.");
    },
  });
}
