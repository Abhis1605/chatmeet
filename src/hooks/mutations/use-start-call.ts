"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { startCall } from "@/services/call.service";
import { queryKeys } from "@/lib/query-keys";

export function useStartCall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chatId: string) => startCall(chatId),
    onSuccess: (_data, chatId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calls.active(chatId) });
    },
  });
}
