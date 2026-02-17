import { prisma } from "@/lib/prisma";
import Hero from "@/components/landing/Hero";
import FeaturedDishes from "@/components/landing/FeaturedDishes";

export const dynamic = "force-dynamic";

const HERO_BG =
  "https://images.unsplash.com/photo-1579196479727-de5490858892?auto=format&fit=crop&w=1920&q=80";

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
      imageUrl: d.imageUrl,
      imageCredit: d.imageCredit,
      imageLicenseUrl: d.imageLicenseUrl,
      avgRating: avg ? Math.round(avg * 10) / 10 : null,
      ratingCount: d.ratings.length,
    };
  });

  return (
    <main className="bg-charcoal">
      <Hero backgroundImage={HERO_BG} />
      <FeaturedDishes dishes={featured} />
    </main>
  );
}
