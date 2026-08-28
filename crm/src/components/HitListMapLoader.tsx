"use client";

import dynamic from "next/dynamic";
import type { CityPoint } from "@/components/HitListMap";

// Leaflet touches `window` at import time, so it can only ever render on
// the client — ssr:false is only valid inside a Client Component, hence
// this thin wrapper around the actual map.
const HitListMap = dynamic(() => import("@/components/HitListMap"), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center rounded-xl border border-zinc-200 text-sm text-zinc-400 dark:border-zinc-800"
      style={{ height: 560 }}
    >
      Loading map…
    </div>
  ),
});

export default function HitListMapLoader({ points }: { points: CityPoint[] }) {
  return <HitListMap points={points} />;
}
