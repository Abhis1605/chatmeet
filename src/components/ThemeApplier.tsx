"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSettings } from "@/hooks/queries/use-settings";

export default function ThemeApplier() {
  const { status } = useSession();
  const { data: settings } = useSettings();

  useEffect(() => {
    if (status !== "authenticated" || !settings) return;

    const root = document.documentElement;
    root.classList.remove("dark", "light");

    if (settings.theme === "DARK") {
      root.classList.add("dark");
    } else if (settings.theme === "LIGHT") {
      root.classList.add("light");
    }
  }, [status, settings]);

  return null;
}
