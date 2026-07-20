-- AlterTable
ALTER TABLE "Contact"
  ADD COLUMN "touchCallTextAt" TIMESTAMP(3),
  ADD COLUMN "touchEmailAt" TIMESTAMP(3),
  ADD COLUMN "touchLinkedinAt" TIMESTAMP(3),
  ADD COLUMN "touchDropInAt" TIMESTAMP(3),
  ADD COLUMN "touchCallAt" TIMESTAMP(3),
  ADD COLUMN "touchTextAt" TIMESTAMP(3),
  ADD COLUMN "touchBreakupAt" TIMESTAMP(3);
