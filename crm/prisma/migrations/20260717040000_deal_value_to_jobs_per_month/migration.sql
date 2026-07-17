-- Deal sizing is jobs/month, not a dollar estimate; keep the existing
-- numbers by renaming rather than dropping the column.
ALTER TABLE "Contact" RENAME COLUMN "estimatedValue" TO "jobsPerMonth";

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN "pricePerHl" DOUBLE PRECISION;
