"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { geocodeCity, sleep } from "@/lib/geocoding";

// Nominatim allows at most 1 request/second; batching keeps a single click
// well within a reasonable request time instead of blocking on hundreds of
// sequential lookups. Click again to pick up where it left off.
const BATCH_SIZE = 50;
const RATE_LIMIT_MS = 1100;

export async function geocodeMissingCities(): Promise<void> {
  const [entries, located] = await Promise.all([
    prisma.hitListEntry.findMany({ where: { city: { not: null } }, select: { city: true } }),
    prisma.cityLocation.findMany({ select: { city: true } }),
  ]);

  const locatedSet = new Set(located.map((l) => l.city));
  const missing = new Set(
    entries.map((e) => e.city?.trim()).filter((city): city is string => !!city && !locatedSet.has(city)),
  );

  const batch = Array.from(missing).slice(0, BATCH_SIZE);

  for (const city of batch) {
    const coords = await geocodeCity(city);
    if (coords) {
      await prisma.cityLocation.upsert({
        where: { city },
        create: { city, lat: coords.lat, lng: coords.lng },
        update: {},
      });
    }
    await sleep(RATE_LIMIT_MS);
  }

  revalidatePath("/map");
}
