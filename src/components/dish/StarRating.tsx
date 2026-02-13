interface StarRatingProps {
  average: number | null;
  count: number;
  size?: "sm" | "md";
}

function HalfStar({ fill, className }: { fill: "full" | "half" | "empty"; className?: string }) {
  if (fill === "full") {
    return <span className={`text-amber-400 ${className ?? ""}`}>★</span>;
  }
  if (fill === "empty") {
    return <span className={`text-white/20 ${className ?? ""}`}>★</span>;
  }
  // Half star: overlay a clipped gold star on top of a dim one
  return (
    <span className={`relative inline-block ${className ?? ""}`}>
      <span className="text-white/20">★</span>
      <span className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
        <span className="text-amber-400">★</span>
      </span>
    </span>
  );
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
        className={`font-mono uppercase tracking-wider text-white/40 ${size === "sm" ? "text-xs" : "text-sm"}`}
      >
        No ratings yet
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`flex ${starSize}`}>
        {[1, 2, 3, 4, 5].map((star) => {
          let fill: "full" | "half" | "empty";
          if (average >= star) {
            fill = "full";
          } else if (average >= star - 0.5) {
            fill = "half";
          } else {
            fill = "empty";
          }
          return <HalfStar key={star} fill={fill} />;
        })}
      </div>
      <span
        className={`font-mono text-white/50 ${size === "sm" ? "text-sm" : "text-base"}`}
      >
        {average.toFixed(1)} ({count})
      </span>
    </div>
  );
}
