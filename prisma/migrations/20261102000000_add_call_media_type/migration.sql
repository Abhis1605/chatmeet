-- Distinguishes video calls from audio-only calls
ALTER TABLE "CallSession"
ADD COLUMN "mediaType" TEXT NOT NULL DEFAULT 'VIDEO';
