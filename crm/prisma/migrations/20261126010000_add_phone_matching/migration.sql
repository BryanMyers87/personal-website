-- CreateEnum
CREATE TYPE "CommunicationStatus" AS ENUM ('MATCHED', 'UNMATCHED', 'IGNORED');

-- AlterTable
ALTER TABLE "CommunicationLogEntry"
  ADD COLUMN "rawNumber" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "summary" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "status" "CommunicationStatus" NOT NULL DEFAULT 'MATCHED';

-- CreateTable
CREATE TABLE "PhoneAlias" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contactId" TEXT,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhoneAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IgnoredPhoneNumber" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IgnoredPhoneNumber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhoneAlias_phone_key" ON "PhoneAlias"("phone");

-- CreateIndex
CREATE INDEX "PhoneAlias_companyId_idx" ON "PhoneAlias"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "IgnoredPhoneNumber_phone_key" ON "IgnoredPhoneNumber"("phone");

-- CreateIndex
CREATE INDEX "CommunicationLogEntry_rawNumber_idx" ON "CommunicationLogEntry"("rawNumber");

-- CreateIndex
CREATE INDEX "CommunicationLogEntry_status_idx" ON "CommunicationLogEntry"("status");

-- AddForeignKey
ALTER TABLE "PhoneAlias" ADD CONSTRAINT "PhoneAlias_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneAlias" ADD CONSTRAINT "PhoneAlias_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
