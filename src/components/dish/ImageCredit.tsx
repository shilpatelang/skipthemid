"use client";

import { Info } from "lucide-react";

export default function ImageCredit({ credit, licenseUrl }: { credit: string; licenseUrl?: string | null }) {
  return (
    <div className="group/credit absolute bottom-2 left-2 z-10">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white/60 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white/90">
        <Info className="h-3.5 w-3.5" />
      </div>
      <div className="pointer-events-none absolute bottom-6 left-0 whitespace-nowrap rounded-lg bg-black/80 px-3 py-1.5 text-xs text-white/80 opacity-0 backdrop-blur-sm transition-opacity group-hover/credit:pointer-events-auto group-hover/credit:opacity-100">
        {licenseUrl ? (
          <span
            role="link"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(licenseUrl, "_blank", "noopener,noreferrer"); }}
            className="cursor-pointer underline decoration-white/40 underline-offset-2 hover:text-white"
          >
            {credit}
          </span>
        ) : (
          credit
        )}
      </div>
    </div>
  );
}
