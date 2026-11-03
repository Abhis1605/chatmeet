-- Email invites for rooms: allow invites that are not tied to an existing user
ALTER TABLE "RoomInvite" ALTER COLUMN "invitedUserId" DROP NOT NULL;

ALTER TABLE "RoomInvite" ADD COLUMN "token" TEXT;
ALTER TABLE "RoomInvite" ADD COLUMN "invitedEmail" TEXT;
ALTER TABLE "RoomInvite" ADD COLUMN "expiresAt" TIMESTAMP(3);

-- Existing rows keep a stable, unique link token.
UPDATE "RoomInvite" SET "token" = "id";

ALTER TABLE "RoomInvite" ALTER COLUMN "token" SET NOT NULL;

CREATE UNIQUE INDEX "RoomInvite_token_key" ON "RoomInvite"("token");
CREATE INDEX "RoomInvite_invitedEmail_idx" ON "RoomInvite"("invitedEmail");
