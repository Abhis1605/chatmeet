"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchCallHistory } from "@/services/call.service";

export function useCallHistory() {
  return useInfiniteQuery({
    queryKey: queryKeys.calls.history,
    queryFn: ({ pageParam }) =>
      fetchCallHistory(pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
  });
}
