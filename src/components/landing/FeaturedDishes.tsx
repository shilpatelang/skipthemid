import DishCard from "@/components/dish/DishCard";

interface FeaturedDish {
  slug: string;
  name: string;
  cuisine: string;
  category: string;
  origin: string;
  description: string;
  imageUrl: string | null;
  imageCredit: string | null;
  imageLicenseUrl: string | null;
  avgRating: number | null;
  ratingCount: number;
}

function getBentoSize(index: number): "large" | "wide" | "standard" {
  const pos = index % 5;
  if (pos === 0) return "large";
  if (pos === 3) return "wide";
  return "standard";
}

export default function FeaturedDishes({ dishes }: { dishes: FeaturedDish[] }) {
  return (
    <section id="dishes" className="px-4 pb-20 pt-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex items-center gap-6">
          <h2 className="font-serif text-2xl font-bold tracking-wide text-white">
            Featured Dishes
          </h2>
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs font-medium uppercase tracking-widest text-gold">
            {dishes.length} dishes
          </span>
        </div>
        <div className="grid auto-rows-[280px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dishes.map((dish, i) => {
            const size = getBentoSize(i);
            const className =
              size === "large"
                ? "sm:col-span-2 sm:row-span-2"
                : size === "wide"
                  ? "sm:col-span-2"
                  : "";
            return (
              <DishCard key={dish.slug} {...dish} className={className} />
            );
          })}
        </div>
      </div>
    </section>
  );
}
