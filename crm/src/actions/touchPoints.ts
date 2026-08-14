"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { TouchPointKey } from "@/lib/touchPoints";

export async function setTouchPoint(companyId: string, key: TouchPointKey, checked: boolean): Promise<void> {
  const value = checked ? new Date() : null;

  const data =
    key === "callText"
      ? { touchCallTextAt: value }
      : key === "email"
        ? { touchEmailAt: value }
        : key === "linkedin"
          ? { touchLinkedinAt: value }
          : key === "dropIn"
            ? { touchDropInAt: value }
            : key === "call"
              ? { touchCallAt: value }
              : key === "text"
                ? { touchTextAt: value }
                : { touchBreakupAt: value };

  await prisma.company.update({ where: { id: companyId }, data });
  revalidatePath(`/companies/${companyId}`);
}
