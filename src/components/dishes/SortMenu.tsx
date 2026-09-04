"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ArrowUpDown } from "lucide-react";

export const SORT_OPTIONS = [
  { value: "name-asc", label: "A–Z" },
  { value: "name-desc", label: "Z–A" },
  { value: "newest", label: "Newly added" },
  { value: "most-rated", label: "Most rated" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

const DEFAULT_SORT: SortValue = "name-asc";

export default function SortMenu() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = (searchParams.get("sort") as SortValue) || DEFAULT_SORT;
  const currentLabel =
    SORT_OPTIONS.find((o) => o.value === current)?.label ?? "A–Z";
  const [open, setOpen] = useState(false);

  function setSort(value: SortValue) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === DEFAULT_SORT) params.delete("sort");
    else params.set("sort", value);
    params.delete("page"); // sort change resets pagination
    const qs = params.toString();
    router.push(qs ? `/dishes?${qs}` : "/dishes");
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-medium text-ink/75 shadow-sm transition-colors hover:border-ink/20 hover:text-ink"
      >
        <ArrowUpDown size={14} strokeWidth={2.5} />
        <span>Sort</span>
        <span className="text-ink/35">·</span>
        <span>{currentLabel}</span>
        <ChevronDown size={14} strokeWidth={2.5} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 min-w-[180px] rounded-xl border border-ink/10 bg-white/95 p-2 shadow-xl backdrop-blur-2xl">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
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
}
