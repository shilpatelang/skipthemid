"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";

interface RatingInputProps {
  dishId: string;
  initialRating?: number;
}

export default function RatingInput({ dishId, initialRating }: RatingInputProps) {
  const { data: session, status } = useSession();
  const [rating, setRating] = useState<number>(initialRating ?? 0);
  const [hovered, setHovered] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (status === "loading") {
    return <div className="h-8 w-40 animate-pulse rounded bg-gray-200" />;
  }

  if (!session?.user) {
    return (
      <button
        onClick={() => signIn("google")}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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

  return (
    <div className="flex items-center gap-3">
      <div className="flex text-2xl">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            disabled={submitting}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => handleClick(star)}
            className={`transition-colors ${
              star <= (hovered || rating)
                ? "text-amber-400"
                : "text-gray-300"
            } ${submitting ? "cursor-wait" : "cursor-pointer hover:scale-110"}`}
          >
            ★
          </button>
        ))}
      </div>
      {submitted && <span className="text-sm text-green-600">Saved!</span>}
      {rating > 0 && !submitted && (
        <span className="text-sm text-gray-500">Your rating: {rating}/5</span>
      )}
    </div>
  );
}
