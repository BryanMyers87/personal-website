"use server";

import { revalidatePath } from "next/cache";
import { disconnectGoogleCalendar } from "@/lib/googleCalendar";

export async function disconnectGoogleCalendarAction(): Promise<void> {
  await disconnectGoogleCalendar();
  revalidatePath("/settings");
}
