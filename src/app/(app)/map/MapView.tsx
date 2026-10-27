"use client";

import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Circle, CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

export type MapShop = { id: string; name: string; lat: number; lng: number; openNeeds: number; category: string };

// Leaflet + OpenStreetMap tiles (attribution required). Shops as circle
// markers: board yellow with an ink ring when hiring, grey otherwise.
export default function MapView({ base, shops }: { base: { lat: number; lng: number }; shops: MapShop[] }) {
  const t = useTranslations("map");
  const [onlyHiring, setOnlyHiring] = useState(true);
  const visible = useMemo(() => (onlyHiring ? shops.filter((s) => s.openNeeds > 0) : shops), [shops, onlyHiring]);
  const hiringCount = shops.filter((s) => s.openNeeds > 0).length;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button type="button" className="chip flex-1 justify-center" aria-pressed={onlyHiring} onClick={() => setOnlyHiring(true)}>
          {t("hiring")} <span className="tabular opacity-70">{hiringCount}</span>
        </button>
        <button type="button" className="chip flex-1 justify-center" aria-pressed={!onlyHiring} onClick={() => setOnlyHiring(false)}>
          {t("allShops")} <span className="tabular opacity-70">{shops.length}</span>
        </button>
      </div>
      <div className="relative isolate z-0 h-[calc(100dvh-17rem)] min-h-80 overflow-hidden rounded-board border-2 border-ink">
        <MapContainer center={[base.lat, base.lng]} zoom={14} className="size-full" scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <Circle center={[base.lat, base.lng]} radius={120} pathOptions={{ color: "#c8102e", fillColor: "#c8102e", fillOpacity: 0.9, weight: 3 }} />
          {visible.map((s) => (
            <CircleMarker
              key={s.id}
              center={[s.lat, s.lng]}
              radius={s.openNeeds > 0 ? 9 : 6}
              pathOptions={
                s.openNeeds > 0
                  ? { color: "#111111", weight: 2.5, fillColor: "#ffc72c", fillOpacity: 1 }
                  : { color: "#4b5159", weight: 1.5, fillColor: "#c9cdd3", fillOpacity: 0.9 }
              }
            >
              <Popup>
                <div className="min-w-40 space-y-1 font-sans">
                  <p className="text-[15px] font-bold">{s.name}</p>
                  <p className="text-sm text-ink-2">{s.category}</p>
                  {s.openNeeds > 0 && <p className="text-sm font-semibold">{t("openNeeds", { count: s.openNeeds })}</p>}
                  <Link href={`/enterprises/${s.id}`} className="text-sm font-bold text-bus underline">
                    {t("openShop")}
                  </Link>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <p className="flex items-center gap-4 text-sm text-ink-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-full border-2 border-ink bg-board" aria-hidden />
          {t("legendHiring")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-bus" aria-hidden />
          {t("legendBase")}
        </span>
      </p>
    </div>
  );
}
