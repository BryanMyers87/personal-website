// Free, key-free city geocoding via OpenStreetMap's Nominatim. Only ever
// called with a bare city/town name (never a street address), and callers
// must respect Nominatim's usage policy: max 1 request/second and a
// descriptive User-Agent (no API key required or accepted).
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export async function geocodeCity(city: string): Promise<{ lat: number; lng: number } | null> {
  const params = new URLSearchParams({
    format: "json",
    limit: "1",
    city,
    countrycodes: "ca",
  });

  const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: { "User-Agent": "InflateAI-CRM-HitListMap/1.0" },
  });
  if (!res.ok) return null;

  const results = (await res.json()) as { lat: string; lon: string }[];
  const first = results[0];
  if (!first) return null;

  const lat = parseFloat(first.lat);
  const lng = parseFloat(first.lon);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

  return { lat, lng };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
