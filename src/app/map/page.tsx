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
    fetch("/api/dishes")
      .then((res) => res.json())
      .then(setGeojson)
      .catch(console.error);
  }, []);

  return <MapContainer geojson={geojson} />;
}
