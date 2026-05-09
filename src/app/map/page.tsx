"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { DishFeatureCollection } from "@/lib/geojson";

const MapContainer = dynamic(
  () => import("@/components/map/MapContainer"),
  { ssr: false }
);

export default function MapPage() {
  const [geojson, setGeojson] = useState<DishFeatureCollection | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/dishes", { signal: ac.signal })
      .then((res) => res.json())
      .then(setGeojson)
      .catch((e) => {
        if (e.name !== "AbortError") console.error(e);
      });
    return () => ac.abort();
  }, []);

  return <MapContainer geojson={geojson} />;
}
