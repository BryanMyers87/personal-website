-- CreateEnum
CREATE TYPE "CommunicationKind" AS ENUM ('CALL', 'TEXT');

-- CreateTable
CREATE TABLE "CommunicationLogEntry" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "kind" "CommunicationKind" NOT NULL,
    "companyId" TEXT,
    "journalEntryId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunicationLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationLogEntry_externalId_key" ON "CommunicationLogEntry"("externalId");

-- CreateIndex
CREATE INDEX "CommunicationLogEntry_companyId_idx" ON "CommunicationLogEntry"("companyId");
