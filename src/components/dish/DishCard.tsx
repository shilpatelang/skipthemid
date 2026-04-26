import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import StarRating from "./StarRating";
import ImageCredit from "./ImageCredit";

interface DishCardProps {
  slug: string;
  name: string;
  cuisine: string;
  category: string;
  origin: string;
  description: string;
  imageUrl: string | null;
  imageCredit?: string | null;
  imageLicenseUrl?: string | null;
  avgRating: number | null;
  ratingCount: number;
  className?: string;
}

export default function DishCard({
  slug,
  name,
  cuisine,
  origin,
  imageUrl,
  imageCredit,
  imageLicenseUrl,
  avgRating,
  ratingCount,
  className = "",
}: DishCardProps) {
  return (
    <Link
      href={`/dish/${slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative block overflow-hidden rounded-2xl ${className}`}
    >
      {/* Background image */}
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
      )}

      {/* Dark gradient overlay for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

      {/* Image credit icon — bottom left */}
      {imageCredit && <ImageCredit credit={imageCredit} licenseUrl={imageLicenseUrl} />}

      {/* Origin pill badge — top right */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-gold/90 px-2.5 py-1 text-xs font-semibold text-charcoal backdrop-blur-sm">
        <MapPin className="h-3 w-3" />
        {origin}
      </div>

      {/* Glassmorphism content overlay */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <div className="rounded-xl bg-black/40 px-4 py-3 backdrop-blur-md">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            {cuisine}
          </p>
          <h3 className="mt-1 font-serif text-xl font-bold tracking-tighter text-white">
            {name}
          </h3>
          <div className="mt-2">
            <StarRating average={avgRating} count={ratingCount} size="sm" />
          </div>
        </div>
      </div>
    </Link>
  );
}
