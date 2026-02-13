import Link from "next/link";
import StarRating from "./StarRating";

interface DishCardProps {
  slug: string;
  name: string;
  cuisine: string;
  category: string;
  origin: string;
  description: string;
  avgRating: number | null;
  ratingCount: number;
}

export default function DishCard({
  slug,
  name,
  cuisine,
  origin,
  description,
  avgRating,
  ratingCount,
}: DishCardProps) {
  return (
    <Link
      href={`/dish/${slug}`}
      className="group block rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-gray-400">
        <span>{cuisine}</span>
        <span className="text-gray-200">·</span>
        <span>{origin}</span>
      </div>
      <h3 className="mt-2 text-xl font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
        {name}
      </h3>
      <p className="mt-2 line-clamp-2 text-base leading-relaxed text-gray-500">
        {description}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <StarRating average={avgRating} count={ratingCount} size="sm" />
        <span className="text-sm text-gray-300 transition-colors group-hover:text-amber-500">
          →
        </span>
      </div>
    </Link>
  );
}
