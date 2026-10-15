-- CreateTable
CREATE TABLE "RevenueEntry" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RevenueEntry_companyId_idx" ON "RevenueEntry"("companyId");

-- CreateIndex
CREATE INDEX "RevenueEntry_receivedAt_idx" ON "RevenueEntry"("receivedAt");

-- AddForeignKey
ALTER TABLE "RevenueEntry" ADD CONSTRAINT "RevenueEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
