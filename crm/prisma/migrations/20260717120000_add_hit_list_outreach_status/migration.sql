-- CreateEnum
CREATE TYPE "HitListOutreachStatus" AS ENUM ('NOT_CONTACTED', 'ATTEMPTED', 'RESPONDED', 'NOT_INTERESTED');

-- AlterTable
ALTER TABLE "HitListEntry" ADD COLUMN "outreachStatus" "HitListOutreachStatus" NOT NULL DEFAULT 'NOT_CONTACTED';

-- Best-effort backfill: the old system only tracked a contacted/not
-- boolean, so anything already marked contacted becomes "Attempted"
-- (the most conservative read of "something was logged").
UPDATE "HitListEntry" SET "outreachStatus" = 'ATTEMPTED' WHERE "contactedAt" IS NOT NULL;
