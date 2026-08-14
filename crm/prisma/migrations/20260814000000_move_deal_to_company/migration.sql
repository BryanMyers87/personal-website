-- The company is the deal now, not the contact. Move every deal field from
-- Contact to Company, retarget StageHistoryEntry/Reminder/JournalEntry/
-- OnboardingFile at Company instead of Contact, and add isDecisionMaker to
-- Contact (now a lightweight person record).

-- 1. Add deal columns to Company (defaults match today's Contact defaults)
ALTER TABLE "Company"
  ADD COLUMN "stage" "DealStage" NOT NULL DEFAULT 'PROSPECT',
  ADD COLUMN "status" "DealStatus" NOT NULL DEFAULT 'OPEN',
  ADD COLUMN "source" TEXT,
  ADD COLUMN "jobsPerMonth" DOUBLE PRECISION,
  ADD COLUMN "pricePerHl" DOUBLE PRECISION,
  ADD COLUMN "appointmentDate" TIMESTAMP(3),
  ADD COLUMN "lostReason" TEXT,
  ADD COLUMN "closedAt" TIMESTAMP(3),
  ADD COLUMN "touchCallTextAt" TIMESTAMP(3),
  ADD COLUMN "touchEmailAt" TIMESTAMP(3),
  ADD COLUMN "touchLinkedinAt" TIMESTAMP(3),
  ADD COLUMN "touchDropInAt" TIMESTAMP(3),
  ADD COLUMN "touchCallAt" TIMESTAMP(3),
  ADD COLUMN "touchTextAt" TIMESTAMP(3),
  ADD COLUMN "touchBreakupAt" TIMESTAMP(3),
  ADD COLUMN "firstTouchScheduledAt" TIMESTAMP(3),
  ADD COLUMN "healthTier" "AccountHealth";

-- CreateIndex
CREATE INDEX "Company_stage_idx" ON "Company"("stage");

-- 2. Add isDecisionMaker to Contact
ALTER TABLE "Contact" ADD COLUMN "isDecisionMaker" BOOLEAN NOT NULL DEFAULT false;

-- 3. Every orphan contact (companyId IS NULL) gets its own new Company so no
-- deal data is lost. Looping (not a bulk INSERT...SELECT) because each
-- contact needs a distinct new company id it can then be pointed at.
DO $$
DECLARE
  r RECORD;
  new_id TEXT;
BEGIN
  FOR r IN SELECT id, "firstName", "lastName" FROM "Contact" WHERE "companyId" IS NULL LOOP
    new_id := gen_random_uuid()::text;
    INSERT INTO "Company" (id, name, "createdAt", "updatedAt")
    VALUES (new_id, CONCAT(r."firstName", ' ', r."lastName"), NOW(), NOW());
    UPDATE "Contact" SET "companyId" = new_id WHERE id = r.id;
  END LOOP;
END $$;

-- 4. Backfill each Company's deal fields from its "primary" contact: WON
-- first, then furthest stage reached, then most recently updated.
-- Companies with zero contacts simply keep the step-1 defaults
-- (PROSPECT/OPEN) — identical to a company created fresh today.
WITH ranked AS (
  SELECT
    c.*,
    ROW_NUMBER() OVER (
      PARTITION BY c."companyId"
      ORDER BY
        CASE WHEN c."status" = 'WON' THEN 1 ELSE 0 END DESC,
        CASE c."stage"
          WHEN 'RELATIONSHIP_MANAGEMENT' THEN 6
          WHEN 'NEGOTIATION' THEN 5
          WHEN 'PROPOSAL' THEN 4
          WHEN 'MEETING' THEN 3
          WHEN 'LEAD_QUALIFICATION' THEN 2
          WHEN 'PROSPECT' THEN 1
          ELSE 0
        END DESC,
        c."updatedAt" DESC
    ) AS rn
  FROM "Contact" c
)
UPDATE "Company" co SET
  "stage" = r."stage",
  "status" = r."status",
  "source" = r."source",
  "jobsPerMonth" = r."jobsPerMonth",
  "pricePerHl" = r."pricePerHl",
  "appointmentDate" = r."appointmentDate",
  "lostReason" = r."lostReason",
  "closedAt" = r."closedAt",
  "touchCallTextAt" = r."touchCallTextAt",
  "touchEmailAt" = r."touchEmailAt",
  "touchLinkedinAt" = r."touchLinkedinAt",
  "touchDropInAt" = r."touchDropInAt",
  "touchCallAt" = r."touchCallAt",
  "touchTextAt" = r."touchTextAt",
  "touchBreakupAt" = r."touchBreakupAt",
  "firstTouchScheduledAt" = r."firstTouchScheduledAt",
  "healthTier" = r."healthTier"
FROM ranked r
WHERE r."companyId" = co."id" AND r."rn" = 1;

-- 5. Move StageHistoryEntry from contactId to companyId
ALTER TABLE "StageHistoryEntry" ADD COLUMN "companyId" TEXT;
UPDATE "StageHistoryEntry" she SET "companyId" = c."companyId" FROM "Contact" c WHERE c."id" = she."contactId";
ALTER TABLE "StageHistoryEntry" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "StageHistoryEntry" DROP CONSTRAINT "StageHistoryEntry_contactId_fkey";
DROP INDEX "StageHistoryEntry_contactId_idx";
ALTER TABLE "StageHistoryEntry" DROP COLUMN "contactId";
CREATE INDEX "StageHistoryEntry_companyId_idx" ON "StageHistoryEntry"("companyId");
ALTER TABLE "StageHistoryEntry" ADD CONSTRAINT "StageHistoryEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. Move Reminder from contactId to companyId
ALTER TABLE "Reminder" ADD COLUMN "companyId" TEXT;
UPDATE "Reminder" rem SET "companyId" = c."companyId" FROM "Contact" c WHERE c."id" = rem."contactId";
ALTER TABLE "Reminder" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Reminder" DROP CONSTRAINT "Reminder_contactId_fkey";
DROP INDEX "Reminder_contactId_idx";
ALTER TABLE "Reminder" DROP COLUMN "contactId";
CREATE INDEX "Reminder_companyId_idx" ON "Reminder"("companyId");
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 7. Move JournalEntry from contactId to companyId
ALTER TABLE "JournalEntry" ADD COLUMN "companyId" TEXT;
UPDATE "JournalEntry" j SET "companyId" = c."companyId" FROM "Contact" c WHERE c."id" = j."contactId";
ALTER TABLE "JournalEntry" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "JournalEntry" DROP CONSTRAINT "JournalEntry_contactId_fkey";
DROP INDEX "JournalEntry_contactId_idx";
ALTER TABLE "JournalEntry" DROP COLUMN "contactId";
CREATE INDEX "JournalEntry_companyId_idx" ON "JournalEntry"("companyId");
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 8. Move OnboardingFile from contactId to companyId
ALTER TABLE "OnboardingFile" ADD COLUMN "companyId" TEXT;
UPDATE "OnboardingFile" o SET "companyId" = c."companyId" FROM "Contact" c WHERE c."id" = o."contactId";
ALTER TABLE "OnboardingFile" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "OnboardingFile" DROP CONSTRAINT "OnboardingFile_contactId_fkey";
DROP INDEX "OnboardingFile_contactId_idx";
ALTER TABLE "OnboardingFile" DROP COLUMN "contactId";
CREATE INDEX "OnboardingFile_companyId_idx" ON "OnboardingFile"("companyId");
ALTER TABLE "OnboardingFile" ADD CONSTRAINT "OnboardingFile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 9. Drop deal columns + index from Contact; make companyId required with
-- cascade delete (deleting a company deletes its people).
DROP INDEX "Contact_stage_idx";
ALTER TABLE "Contact"
  DROP COLUMN "stage",
  DROP COLUMN "status",
  DROP COLUMN "source",
  DROP COLUMN "jobsPerMonth",
  DROP COLUMN "pricePerHl",
  DROP COLUMN "appointmentDate",
  DROP COLUMN "lostReason",
  DROP COLUMN "closedAt",
  DROP COLUMN "touchCallTextAt",
  DROP COLUMN "touchEmailAt",
  DROP COLUMN "touchLinkedinAt",
  DROP COLUMN "touchDropInAt",
  DROP COLUMN "touchCallAt",
  DROP COLUMN "touchTextAt",
  DROP COLUMN "touchBreakupAt",
  DROP COLUMN "firstTouchScheduledAt",
  DROP COLUMN "healthTier";

ALTER TABLE "Contact" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_companyId_fkey";
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
