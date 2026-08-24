-- CreateTable
CREATE TABLE "WeeklyActivity" (
    "id" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "calls" INTEGER NOT NULL DEFAULT 0,
    "dropIns" INTEGER NOT NULL DEFAULT 0,
    "meetings" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyActivity_weekStart_key" ON "WeeklyActivity"("weekStart");
