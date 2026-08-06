"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { endCall } from "@/services/call.service";
import { queryKeys } from "@/lib/query-keys";

export function useEndCall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => endCall(sessionId),
    onSuccess: (callSession) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.calls.active(callSession.chatId),
      });
    },
  });
}
