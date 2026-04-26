"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

const DEBOUNCE_MS = 300;

export default function SearchBox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = searchParams.get("q") ?? "";
  const [value, setValue] = useState(initial);

  // Keep input in sync if URL changes externally (back button, filter clear)
  useEffect(() => {
    setValue(initial);
  }, [initial]);

  // Debounce navigation on user input
  useEffect(() => {
    if (value === initial) return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) params.set("q", value.trim());
      else params.delete("q");
      params.delete("page"); // any new query resets pagination
      const qs = params.toString();
      router.push(qs ? `/dishes?${qs}` : "/dishes");
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, initial, searchParams, router]);

  return (
    <div className="relative">
      <Search
        size={16}
        strokeWidth={2.5}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/50"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search dishes, origins, cuisines..."
        className="w-full rounded-full border border-white/15 bg-white/5 py-2.5 pl-11 pr-10 text-sm text-white placeholder:text-white/40 outline-none transition-colors focus:border-gold/50 focus:bg-white/10"
      />
      {value && (
        <button
          onClick={() => setValue("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 transition-colors hover:text-white"
        >
          <X size={16} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
