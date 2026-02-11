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
      className="block rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
    >
      <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
      <div className="mt-1 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
          {cuisine}
        </span>
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
          {origin}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-gray-600">{description}</p>
      <div className="mt-3">
        <StarRating average={avgRating} count={ratingCount} size="sm" />
      </div>
    </Link>
  );
}
