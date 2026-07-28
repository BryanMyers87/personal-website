-- CreateTable
CREATE TABLE "HitListEntry" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "website" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "city" TEXT,
    "services" TEXT,
    "contactedAt" TIMESTAMP(3),
    "convertedCompanyId" TEXT,
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HitListEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HitListEntry_convertedCompanyId_key" ON "HitListEntry"("convertedCompanyId");

-- CreateIndex
CREATE INDEX "HitListEntry_companyName_idx" ON "HitListEntry"("companyName");

-- CreateIndex
CREATE INDEX "HitListEntry_contactedAt_idx" ON "HitListEntry"("contactedAt");

-- AddForeignKey
ALTER TABLE "HitListEntry" ADD CONSTRAINT "HitListEntry_convertedCompanyId_fkey" FOREIGN KEY ("convertedCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
