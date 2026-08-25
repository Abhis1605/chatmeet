"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { logoutUser } from "@/services/auth.service";
import { showError } from "@/lib/toast";

export function useLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const confirmLogout = async (toastId: string | number) => {
    if (isLoggingOut) return;

    toast.dismiss(toastId);
    const loadingToastId = toast.loading("Logging out...");
    setIsLoggingOut(true);

    try {
      const data = await logoutUser();

      if (data.error) {
        throw new Error(data.error);
      }

      await signOut({ redirect: false, callbackUrl: "/login" });
      toast.dismiss(loadingToastId);
      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.dismiss(loadingToastId);
      showError(error instanceof Error ? error.message : "Failed to logout");
      setIsLoggingOut(false);
    }
  };

  const handleLogoutClick = () => {
    if (isLoggingOut) return;

    const toastId = toast("Are you sure you want to logout?", {
      description: "You will need to verify your email before signing in again.",
      duration: Infinity,
      action: {
        label: "Yes",
        onClick: () => void confirmLogout(toastId),
      },
      cancel: {
        label: "Cancel",
        onClick: () => toast.dismiss(toastId),
      },
    });
  };

  return { isLoggingOut, handleLogoutClick };
}
