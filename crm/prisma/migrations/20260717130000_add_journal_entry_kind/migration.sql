-- CreateEnum
CREATE TYPE "JournalEntryKind" AS ENUM ('NOTE', 'EMAIL');

-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN "kind" "JournalEntryKind" NOT NULL DEFAULT 'NOTE';
