/**
 * Centralized query key factory.
 * All hooks must import keys from here — no inline key arrays anywhere.
 */
export const queryKeys = {
  chats: {
    all: ["chats"] as const,
    list: (type: string) => ["chats", "list", type] as const,
    // ── Room list key (new, separate from personal/group list) ──────
    room: () => ["chats", "room"] as const,
  },
  messages: {
    byChat: (chatId: string) => ["messages", chatId] as const,
  },
  users: {
    search: (q: string) => ["users", "search", q] as const,
  },
  // ── Room-specific query keys (new) ────────────────────────────────
  rooms: {
    members: (chatId: string) => ["rooms", chatId, "members"] as const,
  },
  invites: {
    pending: ["invites", "pending"] as const,
  },
} as const;

