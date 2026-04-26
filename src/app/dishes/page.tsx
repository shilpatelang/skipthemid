import { notFound } from "next/navigation";
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import DishCard from "@/components/dish/DishCard";
import FilterBar from "@/components/dishes/FilterBar";
import SearchBox from "@/components/dishes/SearchBox";
import SortMenu from "@/components/dishes/SortMenu";
import Pagination from "@/components/ui/Pagination";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Browse all dishes",
  description:
    "Hyper-regional dishes from around the world. Filter by continent, course, or diet — search by name, origin, ingredient, or cuisine.",
};

const PAGE_SIZE = 24;

interface SearchParams {
  page?: string;
  continent?: string;
  course?: string;
  diet?: string;
  q?: string;
  sort?: string;
}

const SORT_MAP: Record<string, Prisma.DishOrderByWithRelationInput> = {
  "name-asc": { name: "asc" },
  "name-desc": { name: "desc" },
  "newest": { createdAt: "desc" },
  "most-rated": { ratings: { _count: "desc" } },
};

export default async function DishesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const requestedPage = Number(params.page) || 1;
  if (!Number.isInteger(requestedPage) || requestedPage < 1) notFound();

  // Filter params map directly to Dish columns. Empty/missing = no filter.
  // Unknown values still pass through to the query — they just yield 0 matches,
  // which is preferable to silently dropping a user-typed param.
  const q = params.q?.trim();
  const where: Prisma.DishWhereInput = {
    ...(params.continent && { continent: params.continent }),
    ...(params.course && { course: params.course }),
    ...(params.diet && { dietType: params.diet }),
    ...(q && {
      OR: [
        { name: { contains: q } },
        { origin: { contains: q } },
        { cuisine: { contains: q } },
        { category: { contains: q } },
        { description: { contains: q } },
      ],
    }),
  };

  const orderBy = SORT_MAP[params.sort ?? ""] ?? SORT_MAP["name-asc"];

  const total = await prisma.dish.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // Out-of-range page only 404s when there ARE results — empty filter result
  // should render the empty state on page 1, not a 404.
  if (total > 0 && requestedPage > totalPages) notFound();

  const dishes = await prisma.dish.findMany({
    where,
    include: { ratings: { select: { value: true } } },
    orderBy,
    skip: (requestedPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const cards = dishes.map((d) => {
    const avg =
      d.ratings.length > 0
        ? d.ratings.reduce((sum, r) => sum + r.value, 0) / d.ratings.length
        : null;
    return {
      slug: d.slug,
      name: d.name,
      cuisine: d.cuisine,
      category: d.category,
      origin: d.origin,
      description: d.description,
      imageUrl: d.imageUrl,
      imageCredit: d.imageCredit,
      imageLicenseUrl: d.imageLicenseUrl,
      avgRating: avg ? Math.round(avg * 10) / 10 : null,
      ratingCount: d.ratings.length,
    };
  });

  return (
    <main className="min-h-screen bg-charcoal px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Browse
          </p>
          <h1 className="mt-2 font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl">
            All dishes
          </h1>
          <p className="mt-3 text-base text-white/70">
            {total} {total === 1 ? "dish" : "dishes"} —
            hyper-regional and probably new to you.
          </p>
        </header>

        <div className="mb-6">
          <SearchBox />
        </div>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <FilterBar />
          <SortMenu />
        </div>

        {cards.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
            <p className="text-base text-white/70">
              No dishes match these filters.
            </p>
            <p className="mt-1 text-sm text-white/50">
              Try removing one filter, or clear all to start over.
            </p>
          </div>
        ) : (
          <div className="grid auto-rows-[280px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((dish) => (
              <DishCard key={dish.slug} {...dish} />
            ))}
          </div>
        )}

        <Pagination
          currentPage={requestedPage}
          totalPages={totalPages}
          basePath="/dishes"
          preservedParams={{
            continent: params.continent,
            course: params.course,
            diet: params.diet,
            q: params.q,
            sort: params.sort,
          }}
        />
      </div>
    </main>
  );
}
