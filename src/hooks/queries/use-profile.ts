"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { getProfile } from "@/services/profile.service";

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.me,
    queryFn: getProfile,
  });
}
