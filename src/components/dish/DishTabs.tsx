"use client";

import { useState } from "react";
import Link from "next/link";

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
  const [activeTab, setActiveTab] = useState<"recipe" | "where">("recipe");

  return (
    <div>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-2">
          <button
            onClick={() => setActiveTab("recipe")}
            className={`px-5 py-4 text-lg font-medium transition-colors ${
              activeTab === "recipe"
                ? "border-b-2 border-amber-500 text-gray-900"
                : "border-b-2 border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            Recipe
          </button>
          <button
            onClick={() => setActiveTab("where")}
            className={`px-5 py-4 text-lg font-medium transition-colors ${
              activeTab === "where"
                ? "border-b-2 border-amber-500 text-gray-900"
                : "border-b-2 border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            Where to Eat
          </button>
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
                      <span className="flex items-center gap-2 rounded-lg bg-amber-50 px-3.5 py-2 text-amber-800">
                        <span className="text-lg">🔪</span>
                        <span className="font-medium">{prepTime} min</span>
                        <span className="text-amber-600">prep</span>
                      </span>
                    )}
                    {cookTime && (
                      <span className="flex items-center gap-2 rounded-lg bg-orange-50 px-3.5 py-2 text-orange-800">
                        <span className="text-lg">🔥</span>
                        <span className="font-medium">{cookTime} min</span>
                        <span className="text-orange-600">cook</span>
                      </span>
                    )}
                    {servings && (
                      <span className="flex items-center gap-2 rounded-lg bg-blue-50 px-3.5 py-2 text-blue-800">
                        <span className="text-lg">🍽️</span>
                        <span className="font-medium">Serves {servings}</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Ingredients */}
                {ingredients && ingredients.length > 0 && (
                  <div>
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">
                      Ingredients
                    </h3>
                    <ul className="space-y-3">
                      {ingredients.map((ing, i) => (
                        <li
                          key={i}
                          className="flex items-baseline gap-3 border-b border-gray-100 pb-3 last:border-0"
                        >
                          <span className="min-w-[5.5rem] text-lg font-medium text-gray-900">
                            {ing.amount}{ing.unit ? ` ${ing.unit}` : ""}
                          </span>
                          <span className="text-lg text-gray-600">
                            {ing.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Steps */}
                {steps && steps.length > 0 && (
                  <div>
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">
                      Directions
                    </h3>
                    <ol className="space-y-5">
                      {steps.map((step, i) => (
                        <li key={i} className="flex gap-4">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-700">
                            {i + 1}
                          </span>
                          <p className="text-lg leading-relaxed text-gray-600 pt-0.5">
                            {step}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-base text-gray-400">Recipe coming soon.</p>
            )}
          </div>
        )}

        {activeTab === "where" && (
          <div className="space-y-6">
            {mapImageUrl && (
              <div className="overflow-hidden rounded-lg border border-gray-100">
                <img
                  src={mapImageUrl}
                  alt={`Map showing ${origin}`}
                  className="w-full"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-gray-400">
                  Origin
                </p>
                <p className="mt-1 text-xl font-medium text-gray-900">
                  {origin}
                </p>
              </div>
              <Link
                href="/map"
                className="rounded-lg bg-gray-900 px-5 py-2.5 text-base font-medium text-white transition-colors hover:bg-gray-800"
              >
                View on World Map
              </Link>
            </div>

            {places.length > 0 && (
              <div>
                <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-400">
                  Recommended Places
                </h3>
                <ul className="divide-y divide-gray-50">
                  {places.map((place) => (
                    <li key={place.id} className="py-4 first:pt-0 last:pb-0">
                      <p className="text-base font-medium text-gray-900">
                        {place.name}
                      </p>
                      <p className="mt-1 text-sm text-gray-400">
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
              <p className="text-base text-gray-400">
                No places listed yet.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
