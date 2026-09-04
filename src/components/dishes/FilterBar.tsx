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
                  ? "border-terracotta/40 bg-terracotta/10 text-terracotta"
                  : "border-ink/10 bg-white text-ink/75 shadow-sm hover:border-ink/20 hover:text-ink"
              }`}
            >
              <span>{filter.label}</span>
              {currentLabel && (
                <>
                  <span className={isActive ? "text-terracotta/60" : "text-ink/35"}>·</span>
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
                <div className="absolute left-0 top-full z-50 mt-2 min-w-[200px] rounded-xl border border-ink/10 bg-white/95 p-2 shadow-xl backdrop-blur-2xl">
                  <button
                    onClick={() => setFilter(filter.key, null)}
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      !current
                        ? "bg-teal-50 text-teal-800"
                        : "text-ink/65 hover:bg-cream hover:text-ink"
                    }`}
                  >
                    All
                  </button>
                  <div className="my-1 h-px bg-ink/10" />
                  {filter.options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFilter(filter.key, opt.value)}
                      className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        current === opt.value
                          ? "bg-terracotta/10 font-semibold text-terracotta"
                          : "text-ink/65 hover:bg-cream hover:text-ink"
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
          className="ml-1 inline-flex items-center gap-1 text-sm font-medium text-ink/55 transition-colors hover:text-terracotta"
        >
          <X size={14} strokeWidth={2.5} />
          Clear all
        </button>
      )}
    </div>
  );
}
