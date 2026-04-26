"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ChevronDown, X } from "lucide-react";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterDef {
  key: string; // URL param name
  label: string; // display label
  options: FilterOption[];
}

const FILTERS: FilterDef[] = [
  {
    key: "continent",
    label: "Continent",
    options: [
      { label: "Africa", value: "africa" },
      { label: "Asia", value: "asia" },
      { label: "Europe", value: "europe" },
      { label: "North America", value: "north-america" },
      { label: "South America", value: "south-america" },
      { label: "Oceania", value: "oceania" },
    ],
  },
  {
    key: "course",
    label: "Course",
    options: [
      { label: "Main", value: "main" },
      { label: "Street Food", value: "street-food" },
      { label: "Appetizer", value: "appetizer" },
      { label: "Side", value: "side" },
      { label: "Snack", value: "snack" },
      { label: "Dessert", value: "dessert" },
    ],
  },
  {
    key: "diet",
    label: "Diet",
    options: [
      { label: "Vegan", value: "vegan" },
      { label: "Vegetarian", value: "vegetarian" },
      { label: "Contains Egg", value: "contains-egg" },
      { label: "Non-Vegetarian", value: "non-vegetarian" },
    ],
  },
];

export default function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [openKey, setOpenKey] = useState<string | null>(null);

  function setFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page"); // any filter change resets pagination
    const qs = params.toString();
    router.push(qs ? `/dishes?${qs}` : "/dishes");
    setOpenKey(null);
  }

  function clearAll() {
    router.push("/dishes");
    setOpenKey(null);
  }

  const hasActive = FILTERS.some((f) => searchParams.get(f.key));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {FILTERS.map((filter) => {
        const current = searchParams.get(filter.key);
        const currentLabel = filter.options.find((o) => o.value === current)?.label;
        const isOpen = openKey === filter.key;
        const isActive = !!current;

        return (
          <div key={filter.key} className="relative">
            <button
              onClick={() => setOpenKey(isOpen ? null : filter.key)}
              className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-gold/60 bg-gold/15 text-gold"
                  : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{filter.label}</span>
              {currentLabel && (
                <>
                  <span className={isActive ? "text-gold/60" : "text-white/40"}>·</span>
                  <span>{currentLabel}</span>
                </>
              )}
              <ChevronDown size={14} strokeWidth={2.5} />
            </button>

            {isOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setOpenKey(null)}
                />
                <div className="absolute left-0 top-full z-50 mt-2 min-w-[200px] rounded-xl border border-white/15 bg-charcoal/95 p-2 backdrop-blur-2xl">
                  <button
                    onClick={() => setFilter(filter.key, null)}
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      !current
                        ? "bg-white/10 text-white"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    All
                  </button>
                  <div className="my-1 h-px bg-white/10" />
                  {filter.options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFilter(filter.key, opt.value)}
                      className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        current === opt.value
                          ? "bg-gold/20 font-semibold text-gold"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        );
      })}

      {hasActive && (
        <button
          onClick={clearAll}
          className="ml-1 inline-flex items-center gap-1 text-sm font-medium text-white/60 transition-colors hover:text-white"
        >
          <X size={14} strokeWidth={2.5} />
          Clear all
        </button>
      )}
    </div>
  );
}
