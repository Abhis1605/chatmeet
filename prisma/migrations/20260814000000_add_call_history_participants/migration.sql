ALTER TABLE "CallSession"
ADD COLUMN "type" TEXT NOT NULL DEFAULT 'ONE_TO_ONE';

CREATE TABLE "CallParticipant" (
  "id" TEXT NOT NULL,
  "callSessionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'INVITED',
  "joinedAt" TIMESTAMP(3),
  "leftAt" TIMESTAMP(3),

  CONSTRAINT "CallParticipant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CallParticipant_callSessionId_userId_key"
ON "CallParticipant"("callSessionId", "userId");

CREATE INDEX "CallParticipant_userId_status_idx"
ON "CallParticipant"("userId", "status");

CREATE INDEX "CallSession_startedAt_id_idx"
ON "CallSession"("startedAt", "id");

ALTER TABLE "CallParticipant"
ADD CONSTRAINT "CallParticipant_callSessionId_fkey"
FOREIGN KEY ("callSessionId") REFERENCES "CallSession"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CallParticipant"
ADD CONSTRAINT "CallParticipant_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
