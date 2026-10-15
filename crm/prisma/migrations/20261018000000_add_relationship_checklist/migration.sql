-- AlterTable
ALTER TABLE "Company"
  ADD COLUMN "sopCompletedAt" TIMESTAMP(3),
  ADD COLUMN "contractCreatedAt" TIMESTAMP(3),
  ADD COLUMN "contractSignedAt" TIMESTAMP(3),
  ADD COLUMN "dropZoneCredentialsAt" TIMESTAMP(3),
  ADD COLUMN "contractorAppOnboardedAt" TIMESTAMP(3),
  ADD COLUMN "contractDate" TIMESTAMP(3);
