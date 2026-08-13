-- CreateEnum
CREATE TYPE "AccountHealth" AS ENUM ('HEALTHY', 'AT_RISK', 'CRITICAL');

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN "healthTier" "AccountHealth";
