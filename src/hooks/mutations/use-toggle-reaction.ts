"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useSocketContext } from "@/providers/socket-provider";
import { updateMessageInCache } from "@/lib/message-cache";
import type { MessageDto } from "@/types/dto/message.dto";

interface ToggleReactionVariables {
  messageId: string;
  emoji: string;
}

function applyReaction(
  message: MessageDto,
  userId: string,
  emoji: string,
  toggle: boolean
): MessageDto {
  const reactions = [...(message.reactions ?? [])];
  const index = reactions.findIndex(
    (reaction) => reaction.emoji === emoji && reaction.userId === userId
  );

  if (toggle) {
    if (index >= 0) reactions.splice(index, 1);
    else reactions.push({ emoji, userId });
  }

  return { ...message, reactions };
}

/** Optimistically toggles an emoji reaction, then lets the server confirm. */
export function useToggleReaction(chatId: string | null) {
  const { socket } = useSocketContext();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  return useMutation({
    mutationFn: async ({ messageId, emoji }: ToggleReactionVariables) => {
      if (!socket) throw new Error("Socket disconnected");
      socket.emit("toggle-reaction", { messageId, emoji });
    },
    onMutate: ({ messageId, emoji }) => {
      if (!chatId || !userId) return;
      updateMessageInCache(queryClient, chatId, messageId, (message) =>
        applyReaction(message, userId, emoji, true)
      );
    },
    onError: (_error, { messageId, emoji }) => {
      if (!chatId || !userId) return;
      updateMessageInCache(queryClient, chatId, messageId, (message) =>
        applyReaction(message, userId, emoji, true)
      );
    },
  });
}
