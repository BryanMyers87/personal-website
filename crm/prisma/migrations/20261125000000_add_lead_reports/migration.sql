-- CreateEnum
CREATE TYPE "LeadGranularity" AS ENUM ('MONTH', 'WEEK');

-- CreateEnum
CREATE TYPE "LeadImportSource" AS ENUM ('ONE_TIME_IMPORT', 'WEEKLY_UPLOAD');

-- CreateEnum
CREATE TYPE "LeadRowStatus" AS ENUM ('MATCHED', 'UNMATCHED', 'SKIPPED_ZERO');

-- CreateTable
CREATE TABLE "LeadReportBatch" (
    "id" TEXT NOT NULL,
    "source" "LeadImportSource" NOT NULL,
    "fileHash" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "granularity" "LeadGranularity" NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "committedAt" TIMESTAMP(3),

    CONSTRAINT "LeadReportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadReport" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "granularity" "LeadGranularity" NOT NULL,
    "leads" INTEGER NOT NULL,
    "appsBooked" INTEGER NOT NULL,
    "billedToContractor" INTEGER NOT NULL,
    "dnq" INTEGER NOT NULL,
    "industry" TEXT,
    "batchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadReportRow" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "rawCompanyName" TEXT NOT NULL,
    "industry" TEXT,
    "leads" INTEGER NOT NULL,
    "appsBooked" INTEGER NOT NULL,
    "billedToContractor" INTEGER NOT NULL,
    "dnq" INTEGER NOT NULL,
    "status" "LeadRowStatus" NOT NULL,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadReportRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyAlias" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyAlias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadReportBatch_fileHash_idx" ON "LeadReportBatch"("fileHash");

-- CreateIndex
CREATE UNIQUE INDEX "LeadReport_companyId_periodStart_periodEnd_key" ON "LeadReport"("companyId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "LeadReport_companyId_idx" ON "LeadReport"("companyId");

-- CreateIndex
CREATE INDEX "LeadReport_periodStart_idx" ON "LeadReport"("periodStart");

-- CreateIndex
CREATE INDEX "LeadReportRow_batchId_idx" ON "LeadReportRow"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyAlias_alias_key" ON "CompanyAlias"("alias");

-- CreateIndex
CREATE INDEX "CompanyAlias_companyId_idx" ON "CompanyAlias"("companyId");

-- AddForeignKey
ALTER TABLE "LeadReport" ADD CONSTRAINT "LeadReport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadReport" ADD CONSTRAINT "LeadReport_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "LeadReportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadReportRow" ADD CONSTRAINT "LeadReportRow_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "LeadReportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadReportRow" ADD CONSTRAINT "LeadReportRow_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyAlias" ADD CONSTRAINT "CompanyAlias_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
