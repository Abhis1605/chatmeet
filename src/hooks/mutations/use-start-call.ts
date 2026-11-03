"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { startCall } from "@/services/call.service";
import { queryKeys } from "@/lib/query-keys";
import type { CallMediaType } from "@/types/dto/call.dto";

export interface StartCallVariables {
  chatId: string;
  type?: "ONE_TO_ONE" | "GROUP";
  mediaType?: CallMediaType;
}

export function useStartCall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chatId,
      type = "ONE_TO_ONE",
      mediaType = "VIDEO",
    }: StartCallVariables) => startCall(chatId, type, mediaType),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.calls.active(variables.chatId),
      });
    },
  });
}
