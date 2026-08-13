-- "Add to Pipeline" now deletes the HitListEntry outright instead of
-- marking it converted and keeping it around, so this tracking is dead.
ALTER TABLE "HitListEntry" DROP CONSTRAINT "HitListEntry_convertedCompanyId_fkey";

-- DropIndex
DROP INDEX "HitListEntry_convertedCompanyId_key";

-- AlterTable
ALTER TABLE "HitListEntry" DROP COLUMN "convertedCompanyId";
ALTER TABLE "HitListEntry" DROP COLUMN "convertedAt";
