"use server";

import { revalidatePath } from "next/cache";
import { startOfWeek } from "date-fns";
import { prisma } from "@/lib/prisma";
import type { ActivityField } from "@/lib/weeklyActivity";

function currentWeekStart(): Date {
  return startOfWeek(new Date(), { weekStartsOn: 1 });
}

export async function adjustActivity(field: ActivityField, delta: number): Promise<void> {
  const weekStart = currentWeekStart();

  const existing = await prisma.weeklyActivity.findUnique({ where: { weekStart } });
  const nextValue = Math.max(0, (existing?.[field] ?? 0) + delta);

  await prisma.weeklyActivity.upsert({
    where: { weekStart },
    create: { weekStart, [field]: nextValue },
    update: { [field]: nextValue },
  });

  revalidatePath("/this-week");
}
