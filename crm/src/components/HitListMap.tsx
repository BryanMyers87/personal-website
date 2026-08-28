"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export type CityPoint = { city: string; lat: number; lng: number; count: number };

// Default center/zoom is a fallback shown for an instant before FitBounds
// takes over — roughly Southern Ontario, where this contractor list lives.
const DEFAULT_CENTER: [number, number] = [43.7, -79.4];
const DEFAULT_ZOOM = 7;

function FitBounds({ points }: { points: CityPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 10);
      return;
    }
    map.fitBounds(
      points.map((p) => [p.lat, p.lng]),
      { padding: [30, 30] },
    );
  }, [points, map]);

  return null;
}

function radiusFor(count: number, maxCount: number) {
  const min = 6;
  const max = 26;
  if (maxCount <= 1) return min;
  return min + (max - min) * (Math.log(count + 1) / Math.log(maxCount + 1));
}

export default function HitListMap({ points }: { points: CityPoint[] }) {
  const maxCount = points.reduce((max, p) => Math.max(max, p.count), 1);

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800" style={{ height: 560 }}>
      <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {points.map((p) => (
          <CircleMarker
            key={p.city}
            center={[p.lat, p.lng]}
            radius={radiusFor(p.count, maxCount)}
            pathOptions={{ color: "#4f46e5", fillColor: "#6366f1", fillOpacity: 0.55, weight: 1.5 }}
          >
            <Popup>
              <span className="font-medium">{p.city}</span>
              <br />
              {p.count} compan{p.count === 1 ? "y" : "ies"}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
