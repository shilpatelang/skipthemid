"use client";

import { useState, type MouseEvent } from "react";
import { useSession, signIn } from "next-auth/react";

interface RatingInputProps {
  dishId: string;
  initialRating?: number;
  size?: "sm" | "md";
}

function StarIcon({
  fill,
  glow,
}: {
  fill: "full" | "half" | "empty";
  glow: boolean;
}) {
  const glowClass = glow ? "star-glow" : "";

  if (fill === "full") {
    return (
      <span className={`text-amber-400 transition-all duration-150 ${glowClass}`}>
        ★
      </span>
    );
  }
  if (fill === "empty") {
    return (
      <span className={`text-white/20 transition-all duration-150 ${glowClass}`}>
        ★
      </span>
    );
  }
  // Half star
  return (
    <span className={`relative inline-block transition-all duration-150 ${glowClass}`}>
      <span className="text-white/20">★</span>
      <span className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
        <span className="text-amber-400">★</span>
      </span>
    </span>
  );
}

export default function RatingInput({ dishId, initialRating, size = "md" }: RatingInputProps) {
  const { data: session, status } = useSession();
  const [rating, setRating] = useState<number>(initialRating ?? 0);
  const [hovered, setHovered] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isSmall = size === "sm";
  const starSize = isSmall ? "text-lg" : "text-2xl";

  if (status === "loading") {
    return <div className={`${isSmall ? "h-6 w-28" : "h-8 w-40"} animate-pulse rounded bg-white/10`} />;
  }

  if (!session?.user) {
    return (
      <button
        onClick={() => signIn("google")}
        className={`rounded bg-gold font-medium text-charcoal hover:bg-gold/90 ${isSmall ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm"}`}
      >
        Sign in to rate
      </button>
    );
  }

  const handleClick = async (value: number) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dishId, value }),
      });
      if (res.ok) {
        setRating(value);
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 2000);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getHalfValue = (star: number, e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeftHalf = e.clientX < rect.left + rect.width / 2;
    return isLeftHalf ? star - 0.5 : star;
  };

  const displayValue = hovered || rating;

  return (
    <div className="flex items-center gap-3">
      <div className={`flex ${starSize}`}>
        {[1, 2, 3, 4, 5].map((star) => {
          let fill: "full" | "half" | "empty";
          if (displayValue >= star) {
            fill = "full";
          } else if (displayValue >= star - 0.5) {
            fill = "half";
          } else {
            fill = "empty";
          }

          const isActive = displayValue >= star - 0.5;

          return (
            <button
              key={star}
              disabled={submitting}
              onMouseMove={(e) => setHovered(getHalfValue(star, e))}
              onMouseLeave={() => setHovered(0)}
              onClick={(e) => handleClick(getHalfValue(star, e))}
              className={`${submitting ? "cursor-wait" : "cursor-pointer"}`}
            >
              <StarIcon fill={fill} glow={isActive && hovered > 0} />
            </button>
          );
        })}
      </div>
      {submitted && <span className={`${isSmall ? "text-xs" : "text-sm"} text-green-400`}>Saved!</span>}
      {rating > 0 && !submitted && (
        <span className={`font-mono ${isSmall ? "text-xs" : "text-sm"} text-white/50`}>Your rating: {rating}/5</span>
      )}
    </div>
  );
}
