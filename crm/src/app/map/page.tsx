import { MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { geocodeMissingCities } from "@/actions/cityLocations";
import HitListMapLoader from "@/components/HitListMapLoader";
import type { CityPoint } from "@/components/HitListMap";

// Reflects newly-geocoded cities right after the backfill action runs;
// never serve a stale build-time snapshot.
export const dynamic = "force-dynamic";

export default async function MapPage() {
  const [entries, locations] = await Promise.all([
    prisma.hitListEntry.findMany({ where: { city: { not: null } }, select: { city: true } }),
    prisma.cityLocation.findMany(),
  ]);

  const counts = new Map<string, number>();
  for (const entry of entries) {
    const city = entry.city?.trim();
    if (!city) continue;
    counts.set(city, (counts.get(city) ?? 0) + 1);
  }

  const locationByCity = new Map(locations.map((l) => [l.city, { lat: l.lat, lng: l.lng }]));

  const points: CityPoint[] = [];
  let missingCount = 0;
  for (const [city, count] of counts) {
    const loc = locationByCity.get(city);
    if (loc) points.push({ city, lat: loc.lat, lng: loc.lng, count });
    else missingCount += 1;
  }
  points.sort((a, b) => b.count - a.count);

  const totalWithCity = entries.filter((e) => e.city?.trim()).length;

  return (
    <div>
      <PageHeader
        title="Map"
        description="Hit List companies by city — city/town level only, no street addresses are ever plotted."
      />

      {missingCount > 0 && (
        <form
          action={geocodeMissingCities}
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          <span className="flex items-center gap-2">
            <MapPin size={16} className="shrink-0" />
            {missingCount} cit{missingCount === 1 ? "y hasn't" : "ies haven't"} been located yet. Locating is rate-limited
            (~1/sec), so a batch may take a minute — click again to pick up where it left off.
          </span>
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500"
          >
            Locate Cities
          </button>
        </form>
      )}

      {points.length === 0 ? (
        <EmptyState
          title={counts.size === 0 ? "No Hit List cities yet" : "No cities located yet"}
          description={
            counts.size === 0
              ? "Add cities to the Hit List to see them here."
              : 'Click "Locate Cities" above to plot them on the map.'
          }
        />
      ) : (
        <>
          <HitListMapLoader points={points} />
          <p className="mt-3 text-xs text-zinc-400">
            {points.length} cit{points.length === 1 ? "y" : "ies"} located · {totalWithCity} Hit List companies with a
            city set
          </p>
        </>
      )}
    </div>
  );
}
