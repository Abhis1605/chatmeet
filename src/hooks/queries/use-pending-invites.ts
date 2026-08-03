"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchPendingInvites } from "@/services/invite.service";

export function usePendingInvites() {
  return useQuery({
    queryKey: queryKeys.invites.pending,
    queryFn: fetchPendingInvites,
  });
}
