import type { Dish, Rating } from "@/generated/prisma";

export interface DishProperties {
  id: string;
  slug: string;
  name: string;
  cuisine: string;
  category: string;
  origin: string;
  avgRating: number | null;
  ratingCount: number;
  imageUrl?: string;
}

export interface DishFeature {
  type: "Feature";
  id: string;
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: DishProperties;
}

export interface DishFeatureCollection {
  type: "FeatureCollection";
  features: DishFeature[];
}

export function toDishFeatureCollection(
  dishes: (Dish & { ratings: Pick<Rating, "value">[] })[]
): DishFeatureCollection {
  return {
    type: "FeatureCollection",
    features: dishes.map((d) => {
      const avg =
        d.ratings.length > 0
          ? d.ratings.reduce((sum, r) => sum + r.value, 0) / d.ratings.length
          : null;
      return {
        type: "Feature" as const,
        id: d.id,
        geometry: {
          type: "Point" as const,
          coordinates: [d.longitude, d.latitude] as [number, number],
        },
        properties: {
          id: d.id,
          slug: d.slug,
          name: d.name,
          cuisine: d.cuisine,
          category: d.category,
          origin: d.origin,
          avgRating: avg ? Math.round(avg * 10) / 10 : null,
          ratingCount: d.ratings.length,
          ...(d.imageUrl ? { imageUrl: d.imageUrl } : {}),
        },
      };
    }),
  };
}
