-- Threaded replies: replies point at a top-level message
ALTER TABLE "Message" ADD COLUMN "parentId" TEXT;

CREATE INDEX "Message_parentId_idx" ON "Message"("parentId");

ALTER TABLE "Message"
ADD CONSTRAINT "Message_parentId_fkey"
FOREIGN KEY ("parentId") REFERENCES "Message"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
