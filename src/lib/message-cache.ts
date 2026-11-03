import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { MessageDto, MessagesPage, ThreadPage } from "@/types/dto/message.dto";

/**
 * Applies a message-level update to the paginated chat cache and any open
 * thread caches. Used by reactions, pins, delivery status and socket patches
 * so every cache copy of a message stays consistent.
 */
export function updateMessageInCache(
  queryClient: QueryClient,
  chatId: string,
  messageId: string,
  updater: (message: MessageDto) => MessageDto
) {
  queryClient.setQueryData<InfiniteData<MessagesPage>>(
    queryKeys.messages.byChat(chatId),
    (prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        pages: prev.pages.map((page) => ({
          ...page,
          messages: page.messages.map((message) =>
            message.id === messageId ? updater(message) : message
          ),
        })),
      };
    }
  );

  queryClient.setQueriesData<ThreadPage>(
    { queryKey: ["messages", "thread", chatId] },
    (prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        parent: prev.parent.id === messageId ? updater(prev.parent) : prev.parent,
        replies: prev.replies.map((reply) =>
          reply.id === messageId ? updater(reply) : reply
        ),
      };
    }
  );
}
