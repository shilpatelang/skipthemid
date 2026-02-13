import DishCard from "@/components/dish/DishCard";

interface FeaturedDish {
  slug: string;
  name: string;
  cuisine: string;
  category: string;
  origin: string;
  description: string;
  avgRating: number | null;
  ratingCount: number;
}

export default function FeaturedDishes({ dishes }: { dishes: FeaturedDish[] }) {
  return (
    <section id="dishes" className="pb-16">
      <div className="mb-8 flex items-center gap-3">
        <h2 className="text-xl font-semibold text-gray-900">
          Featured Dishes
        </h2>
        <div className="h-px flex-1 bg-gray-100" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dishes.map((dish) => (
          <DishCard key={dish.slug} {...dish} />
        ))}
      </div>
    </section>
  );
}
