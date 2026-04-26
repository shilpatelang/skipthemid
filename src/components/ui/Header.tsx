"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Menu, X, Sparkles, ChevronDown } from "lucide-react";
import AuthButton from "@/components/ui/AuthButton";

const STUB_CONTINENTS = [
  { label: "Africa", slug: "africa" },
  { label: "Asia", slug: "asia" },
  { label: "Europe", slug: "europe" },
  { label: "North America", slug: "north-america" },
  { label: "South America", slug: "south-america" },
  { label: "Oceania", slug: "oceania" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSurprise = () => {
    console.log("Surprise me — TODO: random dish redirect");
  };

  const handleSearch = () => {
    console.log("Search — TODO: open search overlay");
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-teal-900 border-b border-teal-400/30 shadow-lg shadow-teal-950/40"
          : "bg-teal-800 border-b border-teal-400/10"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-serif text-xl font-bold tracking-[0.15em] text-white"
        >
          <Image
            src="/icon.png"
            alt="SkipTheMid logo"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
            priority
          />
          SkipTheMid
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/map"
            className="text-sm font-medium uppercase tracking-widest text-white/80 hover:text-white"
          >
            Map
          </Link>

          {/* Browse dropdown */}
          <div className="relative">
            <button
              onClick={() => setBrowseOpen((v) => !v)}
              className="flex items-center gap-1 text-sm font-medium uppercase tracking-widest text-white/80 hover:text-white"
            >
              Browse
              <ChevronDown size={14} />
            </button>
            {browseOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setBrowseOpen(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-3 w-48 rounded-xl border border-teal-400/20 bg-teal-900/95 p-2 backdrop-blur-2xl">
                  <Link
                    href="/dishes"
                    onClick={() => setBrowseOpen(false)}
                    className="block rounded-lg px-4 py-2.5 text-sm text-white hover:bg-white/10"
                  >
                    All dishes
                  </Link>
                  <div className="my-1 h-px bg-white/10" />
                  <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                    Continents
                  </p>
                  {STUB_CONTINENTS.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/dishes?continent=${c.slug}`}
                      onClick={() => setBrowseOpen(false)}
                      className="block rounded-lg px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleSurprise}
            className="flex items-center gap-1.5 text-sm font-medium uppercase tracking-widest text-white/80 hover:text-white"
          >
            <Sparkles size={14} />
            Surprise Me
          </button>

          <button
            onClick={handleSearch}
            aria-label="Search"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white hover:bg-white/15"
          >
            <Search size={18} />
          </button>

          <AuthButton />
        </nav>

        {/* Mobile right cluster */}
        <div className="flex items-center gap-3 md:hidden">
          <AuthButton />
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="border-t border-teal-400/20 bg-teal-900/95 backdrop-blur-xl md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 sm:px-6">
            <Link
              href="/map"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium uppercase tracking-widest text-white/90 hover:bg-white/10"
            >
              Map
            </Link>
            <Link
              href="/dishes"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium uppercase tracking-widest text-white/90 hover:bg-white/10"
            >
              Browse all dishes
            </Link>
            <p className="mt-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/40">
              Continents
            </p>
            {STUB_CONTINENTS.map((c) => (
              <Link
                key={c.slug}
                href={`/dishes?continent=${c.slug}`}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10"
              >
                {c.label}
              </Link>
            ))}
            <button
              onClick={() => {
                setMobileOpen(false);
                handleSurprise();
              }}
              className="mt-2 flex items-center gap-1.5 rounded-lg px-3 py-2 text-left text-sm font-medium uppercase tracking-widest text-white/90 hover:bg-white/10"
            >
              <Sparkles size={14} />
              Surprise Me
            </button>
            <button
              onClick={() => {
                setMobileOpen(false);
                handleSearch();
              }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-left text-sm font-medium uppercase tracking-widest text-white/90 hover:bg-white/10"
            >
              <Search size={14} />
              Search
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
