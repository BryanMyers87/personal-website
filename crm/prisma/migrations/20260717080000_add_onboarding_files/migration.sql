-- CreateTable
CREATE TABLE "OnboardingFile" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OnboardingFile_contactId_idx" ON "OnboardingFile"("contactId");

-- AddForeignKey
ALTER TABLE "OnboardingFile" ADD CONSTRAINT "OnboardingFile_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
