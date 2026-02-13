interface StarRatingProps {
  average: number | null;
  count: number;
  size?: "sm" | "md";
}

export default function StarRating({
  average,
  count,
  size = "md",
}: StarRatingProps) {
  const starSize = size === "sm" ? "text-base" : "text-xl";

  if (average === null) {
    return (
      <span
        className={`text-gray-400 ${size === "sm" ? "text-sm" : "text-base"}`}
      >
        No ratings yet
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`flex ${starSize}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={
              star <= Math.round(average) ? "text-amber-400" : "text-gray-300"
            }
          >
            ★
          </span>
        ))}
      </div>
      <span
        className={`text-gray-500 ${size === "sm" ? "text-sm" : "text-base"}`}
      >
        {average.toFixed(1)} ({count})
      </span>
    </div>
  );
}
