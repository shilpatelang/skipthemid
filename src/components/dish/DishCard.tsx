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
      className={`group relative block overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-[0_12px_35px_rgba(38,59,55,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(38,59,55,0.14)] ${className}`}
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
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-teal-100" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-white/5" />

      {/* Image credit icon — bottom left */}
      {imageCredit && <ImageCredit credit={imageCredit} licenseUrl={imageLicenseUrl} />}

      {/* Origin pill badge — top right */}
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full border border-white/70 bg-white/90 px-2.5 py-1 text-xs font-semibold text-ink shadow-sm backdrop-blur-sm">
        <MapPin className="h-3 w-3" />
        {origin}
      </div>

      {/* Compact label keeps the dish photography visible. */}
      <div className="absolute bottom-3 left-3 z-10 w-fit max-w-[calc(100%-1.5rem)]">
        <div className="w-fit min-w-48 max-w-full rounded-xl border border-white/80 bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur-md">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-terracotta">
            {cuisine}
          </p>
          <h3 className="mt-0.5 font-serif text-lg font-bold tracking-tight text-ink">
            {name}
          </h3>
          <div className="mt-1.5">
            <StarRating average={avgRating} count={ratingCount} size="sm" />
          </div>
        </div>
      </div>
    </Link>
  );
}
