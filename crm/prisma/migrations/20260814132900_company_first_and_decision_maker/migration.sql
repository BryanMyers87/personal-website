/*
  Warnings:

  - Made the column `companyId` on table `Lead` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "title" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT,
    "isDecisionMaker" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Contact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Contact" ("companyId", "createdAt", "email", "firstName", "id", "lastName", "notes", "phone", "title", "updatedAt") SELECT "companyId", "createdAt", "email", "firstName", "id", "lastName", "notes", "phone", "title", "updatedAt" FROM "Contact";
DROP TABLE "Contact";
ALTER TABLE "new_Contact" RENAME TO "Contact";
CREATE INDEX "Contact_companyId_idx" ON "Contact"("companyId");
CREATE TABLE "new_Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'NEW',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "source" TEXT,
    "estimatedValue" REAL,
    "notes" TEXT,
    "appointmentDate" DATETIME,
    "lostReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    "contactId" TEXT,
    CONSTRAINT "Lead_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Lead_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Lead" ("appointmentDate", "companyId", "contactId", "createdAt", "estimatedValue", "id", "lostReason", "notes", "source", "stage", "status", "title", "updatedAt") SELECT "appointmentDate", "companyId", "contactId", "createdAt", "estimatedValue", "id", "lostReason", "notes", "source", "stage", "status", "title", "updatedAt" FROM "Lead";
DROP TABLE "Lead";
ALTER TABLE "new_Lead" RENAME TO "Lead";
CREATE INDEX "Lead_contactId_idx" ON "Lead"("contactId");
CREATE INDEX "Lead_companyId_idx" ON "Lead"("companyId");
CREATE INDEX "Lead_stage_idx" ON "Lead"("stage");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
