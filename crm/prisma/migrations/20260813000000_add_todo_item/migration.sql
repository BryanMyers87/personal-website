-- CreateTable
CREATE TABLE "TodoItem" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TodoItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TodoItem_completedAt_idx" ON "TodoItem"("completedAt");

-- CreateIndex
CREATE INDEX "TodoItem_dueAt_idx" ON "TodoItem"("dueAt");
