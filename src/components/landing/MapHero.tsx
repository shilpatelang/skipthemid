"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import type { DishFeatureCollection } from "@/lib/geojson";

const MapContainer = dynamic(
  () => import("@/components/map/MapContainer"),
  { ssr: false }
);

export default function MapHero() {
  const [geojson, setGeojson] = useState<DishFeatureCollection | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/dishes", { signal: controller.signal })
      .then((res) => res.json())
      .then(setGeojson)
      .catch((error) => {
        if (error.name !== "AbortError") console.error(error);
      });
    return () => controller.abort();
  }, []);

  return (
    <section className="relative overflow-hidden bg-cream px-4 pb-10 pt-12 sm:pt-16">
      <div className="relative z-20 mx-auto max-w-3xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-terracotta/20 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-terracotta shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
          A world of food beyond the usual
        </div>
        <h1 className="font-serif text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
          Follow your appetite
          <span className="block text-teal-700">around the world.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ink/65 sm:text-lg">
          Discover deeply regional dishes, the stories behind them, and recipes
          that rarely make the tourist menu.
        </p>
      </div>

      <div className="relative mx-auto mt-8 h-[64vh] min-h-[500px] max-w-[1500px] overflow-hidden rounded-[2.5rem] border border-teal-900/10 bg-[#f8efe3] shadow-[0_30px_90px_rgba(45,125,120,0.13)]">
        <Image
          src="/images/home-map-kitchen.jpg"
          alt="Warm white kitchen interior"
          fill
          priority
          sizes="(max-width: 1532px) 100vw, 1500px"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-white/10" />
        <div className="relative z-10">
          <MapContainer
            geojson={geojson}
            height="64vh"
            interactive={false}
            initialZoom={1.35}
            transparentSpace
          />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-8 z-20 flex justify-center px-4">
        <Link
          href="/map"
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-xl transition-transform hover:-translate-y-0.5"
        >
            Explore the full map
            <ArrowUpRight className="h-4 w-4" />
        </Link>
        </div>
      </div>
    </section>
  );
}
