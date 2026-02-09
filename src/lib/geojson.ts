import type { Restaurant } from "@/generated/prisma";

export interface RestaurantProperties {
  name: string;
  address: string | null;
  category: string | null;
  dishCount: number;
  bestCount: number;
  midCount: number;
}

export interface RestaurantFeature {
  type: "Feature";
  id: string;
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: RestaurantProperties;
}

export interface RestaurantFeatureCollection {
  type: "FeatureCollection";
  features: RestaurantFeature[];
}

export function toFeatureCollection(
  restaurants: (Restaurant & {
    _count?: { dishes: number };
    dishes?: { tag: string }[];
  })[]
): RestaurantFeatureCollection {
  return {
    type: "FeatureCollection",
    features: restaurants.map((r) => {
      const dishes = r.dishes ?? [];
      return {
        type: "Feature",
        id: r.id,
        geometry: {
          type: "Point",
          coordinates: [r.longitude, r.latitude],
        },
        properties: {
          name: r.name,
          address: r.address,
          category: r.category,
          dishCount: dishes.length,
          bestCount: dishes.filter((d) => d.tag === "BEST").length,
          midCount: dishes.filter((d) => d.tag === "MID").length,
        },
      };
    }),
  };
}
