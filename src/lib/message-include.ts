import { publicUserSelect } from "./public-user";

// Compact sender snapshot used for quoted parents and forwarded sources.
export const messageParentSelect = {
  id: true,
  content: true,
  type: true,
  fileName: true,
  senderId: true,
  createdAt: true,
  sender: { select: publicUserSelect },
} as const;

/**
 * Single source of truth for the message shape sent to clients.
 * Server, REST routes and socket broadcasts must all use this so the client
 * cache never receives partial messages (which would drop reactions/pins).
 */
export const messageInclude = {
  sender: { select: publicUserSelect },
  parent: { select: messageParentSelect },
  forwardedFrom: { select: messageParentSelect },
  mentions: { select: { userId: true } },
  reactions: { select: { emoji: true, userId: true } },
  _count: { select: { replies: true } },
} as const;
