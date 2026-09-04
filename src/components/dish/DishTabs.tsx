"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChefHat } from "lucide-react";
import { scaleAmount, convertUnit } from "@/lib/unitConversion";

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

interface Place {
  id: string;
  name: string;
  address: string | null;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface DishTabsProps {
  ingredients: Ingredient[] | null;
  steps: string[] | null;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  places: Place[];
  origin: string;
  mapImageUrl: string;
}

type Tab = "recipe" | "where";

const TABS: { id: Tab; label: string }[] = [
  { id: "recipe", label: "Recipe" },
  { id: "where", label: "Where to Eat" },
];

export default function DishTabs({
  ingredients,
  steps,
  prepTime,
  cookTime,
  servings,
  places,
  origin,
  mapImageUrl,
}: DishTabsProps) {
  const hasRecipe = (ingredients && ingredients.length > 0) || (steps && steps.length > 0);
  const [activeTab, setActiveTab] = useState<Tab>("recipe");
  const [unitSystem, setUnitSystem] = useState<"metric" | "imperial">("metric");
  const [targetServings, setTargetServings] = useState<number>(servings ?? 4);

  return (
    <div>
      {/* Tab navigation with sliding indicator */}
      <div className="border-b border-ink/10">
        <nav className="-mb-px flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative px-5 py-4 text-lg font-medium transition-colors"
            >
              <span
                className={
                  activeTab === tab.id
                    ? "text-ink"
                    : "text-ink/45 hover:text-ink/75"
                }
              >
                {tab.label}
                {tab.id === "where" && places.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center rounded-full bg-terracotta px-2 py-0.5 text-xs font-bold text-white">
                    {places.length}
                  </span>
                )}
              </span>

              {/* Sliding gold underline */}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-indicator"
                className="absolute inset-x-0 -bottom-px h-[3px] rounded-full bg-terracotta"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="py-8">
        {activeTab === "recipe" && (
          <div>
            {hasRecipe ? (
              <div className="space-y-10">
                {/* Timing badges */}
                {(prepTime || cookTime || servings) && (
                  <div className="flex flex-wrap gap-6 text-base">
                    {prepTime && (
                      <span className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3.5 py-2 text-amber-400">
                        <span className="text-lg">🔪</span>
                        <span className="font-medium">{prepTime} min</span>
                        <span className="text-amber-500/60">prep</span>
                      </span>
                    )}
                    {cookTime && (
                      <span className="flex items-center gap-2 rounded-lg bg-orange-500/10 px-3.5 py-2 text-orange-400">
                        <span className="text-lg">🔥</span>
                        <span className="font-medium">{cookTime} min</span>
                        <span className="text-orange-500/60">cook</span>
                      </span>
                    )}
                    {servings && (
                      <span className="flex items-center gap-2 rounded-lg bg-blue-500/10 px-3.5 py-2 text-blue-400">
                        <span className="text-lg">🍽️</span>
                        <button
                          onClick={() => setTargetServings(Math.max(1, targetServings - 1))}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/15 text-sm font-bold transition-colors hover:bg-blue-500/25"
                        >
                          −
                        </button>
                        <span className="min-w-[1.5rem] text-center font-medium tabular-nums">
                          {targetServings}
                        </span>
                        <button
                          onClick={() => setTargetServings(targetServings + 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/15 text-sm font-bold transition-colors hover:bg-blue-500/25"
                        >
                          +
                        </button>
                      </span>
                    )}
                  </div>
                )}

                {/* Ingredients */}
                {ingredients && ingredients.length > 0 && (
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-ink">
                        Ingredients
                      </h3>
                      <div className="flex items-center gap-1 text-sm">
                        <button
                          onClick={() => setUnitSystem("metric")}
                          className={`rounded-full px-3 py-1 transition-colors ${
                            unitSystem === "metric"
                              ? "bg-terracotta/10 font-medium text-terracotta"
                              : "text-ink/40 hover:text-ink/65"
                          }`}
                        >
                          Metric
                        </button>
                        <button
                          onClick={() => setUnitSystem("imperial")}
                          className={`rounded-full px-3 py-1 transition-colors ${
                            unitSystem === "imperial"
                              ? "bg-terracotta/10 font-medium text-terracotta"
                              : "text-ink/40 hover:text-ink/65"
                          }`}
                        >
                          Imperial
                        </button>
                      </div>
                    </div>
                    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {ingredients.map((ing, i) => {
                        const ratio = servings ? targetServings / servings : 1;
                        const scaled = scaleAmount(ing.amount, ratio);
                        const { amount: displayAmt, unit: displayUnit } = convertUnit(scaled, ing.unit, unitSystem);
                        return (
                          <li
                            key={i}
                            className="flex items-baseline gap-3 border-b border-ink/10 pb-3"
                          >
                            <span className="min-w-[5.5rem] text-lg font-medium text-ink tabular-nums">
                              {displayAmt}{displayUnit ? ` ${displayUnit}` : ""}
                            </span>
                            <span className="text-lg text-ink/60">
                              {ing.name}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Steps */}
                {steps && steps.length > 0 && (
                  <div>
                    <h3 className="mb-4 text-lg font-semibold text-ink">
                      Directions
                    </h3>
                    <ol className="space-y-5">
                      {steps.map((step, i) => (
                        <li key={i} className="flex gap-4">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-sm font-semibold text-terracotta">
                            {i + 1}
                          </span>
                          <p className="pt-0.5 text-lg leading-relaxed text-ink/70">
                            {step}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            ) : (
              /* Styled empty state */
              <div className="flex flex-col items-center justify-center rounded-xl bg-cream px-8 py-16 text-center">
                <ChefHat className="mb-4 h-12 w-12 text-ink/20" />
                <p className="font-mono text-sm uppercase tracking-wider text-ink/40">
                  Recipe coming soon
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "where" && (
          <div className="space-y-6">
            {mapImageUrl && (
              <div className="overflow-hidden rounded-2xl border border-ink/10">
                <img
                  src={mapImageUrl}
                  alt={`Map showing ${origin}`}
                  className="w-full"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-ink/40">
                  Origin
                </p>
                <p className="mt-1 text-xl font-medium text-ink">
                  {origin}
                </p>
              </div>
              <Link
                href="/map"
                className="cta-glow rounded-full bg-terracotta px-5 py-2.5 text-base font-medium text-white transition-colors hover:bg-terracotta/90"
              >
                View on World Map
              </Link>
            </div>

            {places.length > 0 && (
              <div>
                <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-ink/40">
                  Recommended Places
                </h3>
                <ul className="divide-y divide-ink/10">
                  {places.map((place) => (
                    <li key={place.id} className="py-4 first:pt-0 last:pb-0">
                      <p className="text-base font-medium text-ink">
                        {place.name}
                      </p>
                      <p className="mt-1 text-sm text-ink/45">
                        {[place.address, `${place.city}, ${place.country}`]
                          .filter(Boolean)
                          .join(" — ")}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {places.length === 0 && (
              <p className="text-base text-ink/45">
                No places listed yet.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
