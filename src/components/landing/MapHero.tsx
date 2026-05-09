"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { DishFeatureCollection } from "@/lib/geojson";

const MapContainer = dynamic(
  () => import("@/components/map/MapContainer"),
  { ssr: false }
);

export default function MapHero() {
  const [geojson, setGeojson] = useState<DishFeatureCollection | null>(null);

  useEffect(() => {
    fetch("/api/dishes")
      .then((res) => res.json())
      .then(setGeojson)
      .catch(console.error);
  }, []);

  return (
    <section className="relative overflow-hidden bg-charcoal py-6">
      <MapContainer geojson={geojson} height="75vh" interactive={false} initialZoom={1.5} />
      <h1 className="sr-only">
        Discover hyper-regional dishes from around the world
      </h1>
      <div className="pointer-events-none absolute inset-x-0 inset-y-6 flex flex-col items-center justify-center px-4 text-center">
        <Link
          href="/map"
          className="pointer-events-auto rounded-lg bg-gold px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-charcoal"
        >
          Explore Full Map
        </Link>
      </div>
    </section>
  );
}
