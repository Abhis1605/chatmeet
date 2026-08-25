"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { getBlockedUsers } from "@/services/settings.service";

export function useBlockedUsers() {
  return useQuery({ queryKey: queryKeys.blockedUsers.all, queryFn: getBlockedUsers });
}
