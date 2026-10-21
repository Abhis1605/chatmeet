-- Logins issued before this time are rejected
ALTER TABLE "User" ADD COLUMN "passwordChangedAt" TIMESTAMP(3);
