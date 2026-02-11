import { prisma } from "@/lib/prisma";
import Hero from "@/components/landing/Hero";
import FeaturedDishes from "@/components/landing/FeaturedDishes";

export default async function Home() {
  const dishes = await prisma.dish.findMany({
    include: { ratings: { select: { value: true } } },
    orderBy: { createdAt: "desc" },
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
      avgRating: avg ? Math.round(avg * 10) / 10 : null,
      ratingCount: d.ratings.length,
    };
  });

  return (
    <main className="mx-auto max-w-6xl px-4">
      <Hero />
      <FeaturedDishes dishes={featured} />
    </main>
  );
}
