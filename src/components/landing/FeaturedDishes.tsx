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
    <section id="dishes" className="py-12">
      <h2 className="mb-8 text-2xl font-bold text-gray-900">
        Featured Dishes
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dishes.map((dish) => (
          <DishCard key={dish.slug} {...dish} />
        ))}
      </div>
    </section>
  );
}
