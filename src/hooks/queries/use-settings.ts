"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { getSettings } from "@/services/settings.service";

export function useSettings() {
  return useQuery({ queryKey: queryKeys.settings.me, queryFn: getSettings });
}
