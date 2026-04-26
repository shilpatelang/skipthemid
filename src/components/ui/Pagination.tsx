import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string; // e.g. "/dishes" — page query is appended
  // Other query params to preserve across page navigation (filters, sort, search).
  // Page=1 omits the page param to keep the canonical URL clean.
  preservedParams?: Record<string, string | undefined>;
}

function buildHref(
  basePath: string,
  page: number,
  preserved: Record<string, string | undefined> = {}
): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(preserved)) {
    if (v) params.set(k, v);
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

// Build a compact page list: 1 ... N-1 N N+1 ... last
function pageList(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const out: (number | "ellipsis")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push("ellipsis");
  for (let p = start; p <= end; p++) out.push(p);
  if (end < total - 1) out.push("ellipsis");
  out.push(total);
  return out;
}

export default function Pagination({
  currentPage,
  totalPages,
  basePath,
  preservedParams,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = pageList(currentPage, totalPages);
  const prevPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);
  const atStart = currentPage <= 1;
  const atEnd = currentPage >= totalPages;

  const baseBtn =
    "flex h-10 min-w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5 px-3 text-sm font-medium text-white/80 transition-colors";
  const enabled = "hover:bg-white/15 hover:text-white";
  const disabled = "opacity-40 pointer-events-none";

  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
      <Link
        href={buildHref(basePath, prevPage, preservedParams)}
        aria-disabled={atStart}
        className={`${baseBtn} ${atStart ? disabled : enabled}`}
      >
        <ChevronLeft size={18} strokeWidth={2.5} />
      </Link>

      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span
            key={`e-${i}`}
            className="flex h-10 min-w-10 items-center justify-center text-sm text-white/40"
          >
            …
          </span>
        ) : p === currentPage ? (
          <span
            key={p}
            aria-current="page"
            className="flex h-10 min-w-10 items-center justify-center rounded-lg bg-gold px-3 text-sm font-semibold text-charcoal"
          >
            {p}
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(basePath, p, preservedParams)}
            className={`${baseBtn} ${enabled}`}
          >
            {p}
          </Link>
        )
      )}

      <Link
        href={buildHref(basePath, nextPage, preservedParams)}
        aria-disabled={atEnd}
        className={`${baseBtn} ${atEnd ? disabled : enabled}`}
      >
        <ChevronRight size={18} strokeWidth={2.5} />
      </Link>
    </nav>
  );
}
