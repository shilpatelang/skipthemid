import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import MapHero from "@/components/landing/MapHero";
import FeaturedDishes from "@/components/landing/FeaturedDishes";

export const dynamic = "force-dynamic";

const FEATURED_LIMIT = 6;

export default async function Home() {
  const dishes = await prisma.dish.findMany({
    include: { ratings: { select: { value: true } } },
    orderBy: { createdAt: "desc" },
    take: FEATURED_LIMIT,
  });

  const featured = dishes.map((d) => {
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
    <main className="bg-charcoal">
      <MapHero />
      <FeaturedDishes dishes={featured} />
      <div className="flex justify-center pb-20">
        <Link
          href="/dishes"
          className="group inline-flex items-center gap-2.5 rounded-lg bg-gold px-8 py-3.5 text-sm font-semibold uppercase tracking-widest text-charcoal shadow-lg shadow-gold/20 transition-all hover:gap-3.5 hover:shadow-gold/40"
        >
          Browse all dishes
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </Link>
      </div>
    </main>
  );
}
