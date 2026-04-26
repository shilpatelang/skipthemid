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
    <section className="relative">
      <MapContainer geojson={geojson} height="55vh" interactive={false} />
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        <h1 className="font-serif text-4xl font-bold tracking-[0.15em] text-white sm:text-5xl">
          SkipTheMid
        </h1>
        <p className="mt-2 font-serif text-lg font-light text-white/80 sm:text-xl">
          Discover the World&apos;s Most Extraordinary Dishes
        </p>
        <Link
          href="/map"
          className="pointer-events-auto mt-6 rounded-lg bg-gold px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-charcoal"
        >
          Explore Full Map
        </Link>
      </div>
    </section>
  );
}
