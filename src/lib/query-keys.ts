/**
 * Centralized query key factory.
 * All hooks must import keys from here — no inline key arrays anywhere.
 */
export const queryKeys = {
  chats: {
    all: ["chats"] as const,
    list: (type: string) => ["chats", "list", type] as const,
  },
  messages: {
    byChat: (chatId: string) => ["messages", chatId] as const,
  },
  users: {
    search: (q: string) => ["users", "search", q] as const,
  },
} as const;
