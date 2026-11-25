-- AlterTable
ALTER TABLE "LeadReportRow"
  ADD COLUMN "periodStart" TIMESTAMP(3),
  ADD COLUMN "periodEnd" TIMESTAMP(3),
  ADD COLUMN "granularity" "LeadGranularity";
