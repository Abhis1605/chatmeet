"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { searchUsers } from "@/services/user.service";

/**
 * useUserSearch — searches for users by email.
 * Enabled only when the query string is not empty.
 * staleTime is 30 seconds since presence info might change.
 */
export function useUserSearch(query: string) {
  return useQuery({
    queryKey: queryKeys.users.search(query),
    queryFn: () => searchUsers(query),
    enabled: query.length > 0,
    staleTime: 30_000,
  });
}
