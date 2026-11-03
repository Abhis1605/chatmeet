-- Engagement features: reactions, mentions, pins, forwards, link previews,
-- per-chat archive/mute, and delivery receipts.

ALTER TYPE "MessageType" ADD VALUE IF NOT EXISTS 'AUDIO';

-- Per-chat inbox preferences + delivery receipts
ALTER TABLE "ChatMember" ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "ChatMember" ADD COLUMN "mutedUntil" TIMESTAMP(3);
ALTER TABLE "ChatMember" ADD COLUMN "lastDeliveredAt" TIMESTAMP(3);

-- Message pins, forwards and cached link previews
ALTER TABLE "Message" ADD COLUMN "pinnedAt" TIMESTAMP(3);
ALTER TABLE "Message" ADD COLUMN "pinnedById" TEXT;
ALTER TABLE "Message" ADD COLUMN "forwardedFromId" TEXT;
ALTER TABLE "Message" ADD COLUMN "linkPreview" JSONB;

CREATE INDEX "Message_chatId_pinnedAt_idx" ON "Message"("chatId", "pinnedAt");
CREATE INDEX "Message_forwardedFromId_idx" ON "Message"("forwardedFromId");

ALTER TABLE "Message" ADD CONSTRAINT "Message_forwardedFromId_fkey"
  FOREIGN KEY ("forwardedFromId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "MessageReaction" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MessageMention" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageMention_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MessageReaction_messageId_userId_emoji_key" ON "MessageReaction"("messageId", "userId", "emoji");
CREATE INDEX "MessageReaction_messageId_idx" ON "MessageReaction"("messageId");

CREATE UNIQUE INDEX "MessageMention_messageId_userId_key" ON "MessageMention"("messageId", "userId");
CREATE INDEX "MessageMention_userId_createdAt_idx" ON "MessageMention"("userId", "createdAt");

ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_messageId_fkey"
  FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MessageMention" ADD CONSTRAINT "MessageMention_messageId_fkey"
  FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessageMention" ADD CONSTRAINT "MessageMention_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
