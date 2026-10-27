"use client";

import dynamic from "next/dynamic";
import type { MapShop } from "./MapView";

// Leaflet touches `window`, so the map only renders in the browser.
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="h-[calc(100dvh-14rem)] min-h-80 animate-pulse rounded-board border-2 border-ink bg-surface" />,
});

export function MapLoader(props: { base: { lat: number; lng: number }; shops: MapShop[] }) {
  return <MapView {...props} />;
}
