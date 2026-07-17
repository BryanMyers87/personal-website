-- Contacts ARE the deals now: drop the separate Lead entity and its stage
-- history, then put deal/pipeline fields directly on Contact with the new
-- stage set.

-- DropForeignKey
ALTER TABLE "StageHistoryEntry" DROP CONSTRAINT "StageHistoryEntry_leadId_fkey";

-- DropTable
DROP TABLE "StageHistoryEntry";

-- DropTable
DROP TABLE "Lead";

-- DropType
DROP TYPE "LeadStage";

-- DropType
DROP TYPE "LeadStatus";

-- CreateEnum
CREATE TYPE "DealStage" AS ENUM ('PROSPECT', 'LEAD_QUALIFICATION', 'MEETING', 'PROPOSAL', 'NEGOTIATION');

-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('OPEN', 'WON', 'LOST');

-- AlterTable
ALTER TABLE "Contact"
  ADD COLUMN "stage" "DealStage" NOT NULL DEFAULT 'PROSPECT',
  ADD COLUMN "status" "DealStatus" NOT NULL DEFAULT 'OPEN',
  ADD COLUMN "source" TEXT,
  ADD COLUMN "estimatedValue" DOUBLE PRECISION,
  ADD COLUMN "appointmentDate" TIMESTAMP(3),
  ADD COLUMN "lostReason" TEXT,
  ADD COLUMN "closedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Contact_stage_idx" ON "Contact"("stage");

-- CreateTable
CREATE TABLE "StageHistoryEntry" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "fromStage" "DealStage",
    "toStage" "DealStage" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StageHistoryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StageHistoryEntry_contactId_idx" ON "StageHistoryEntry"("contactId");

-- AddForeignKey
ALTER TABLE "StageHistoryEntry" ADD CONSTRAINT "StageHistoryEntry_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
