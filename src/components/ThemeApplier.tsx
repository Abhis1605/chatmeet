"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSettings } from "@/hooks/queries/use-settings";
import { applyTheme } from "@/lib/theme";

// For logged-in users the theme saved in their settings wins, and is also
// written to localStorage so the next reload starts in the right theme.
export default function ThemeApplier() {
  const { status } = useSession();
  const { data: settings } = useSettings();

  useEffect(() => {
    if (status !== "authenticated" || !settings?.theme) return;
    applyTheme(settings.theme);
  }, [status, settings?.theme]);

  return null;
}
