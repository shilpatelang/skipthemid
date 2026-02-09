import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config(); // .env as fallback
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

// Charlotte metro bounding box
const CHARLOTTE_BBOX = {
  minLng: -81.06,
  minLat: 35.0,
  maxLng: -80.6,
  maxLat: 35.44,
};

const CATEGORIES = ["restaurant", "bar"];
const GRID_SIZE = 4; // 4x4 = 16 quadrants per category

interface MapboxFeature {
  properties: {
    mapbox_id: string;
    name: string;
    full_address?: string;
    coordinates: { longitude: number; latitude: number };
    poi_category?: string[];
  };
}

interface MapboxResponse {
  features: MapboxFeature[];
}

function buildQuadrants() {
  const lngStep =
    (CHARLOTTE_BBOX.maxLng - CHARLOTTE_BBOX.minLng) / GRID_SIZE;
  const latStep =
    (CHARLOTTE_BBOX.maxLat - CHARLOTTE_BBOX.minLat) / GRID_SIZE;

  const quadrants: string[] = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const minLng = CHARLOTTE_BBOX.minLng + i * lngStep;
      const minLat = CHARLOTTE_BBOX.minLat + j * latStep;
      const maxLng = minLng + lngStep;
      const maxLat = minLat + latStep;
      quadrants.push(`${minLng},${minLat},${maxLng},${maxLat}`);
    }
  }
  return quadrants;
}

async function fetchCategory(
  category: string,
  bbox: string,
  token: string
): Promise<MapboxFeature[]> {
  const url = new URL(
    `https://api.mapbox.com/search/searchbox/v1/category/${category}`
  );
  url.searchParams.set("bbox", bbox);
  url.searchParams.set("limit", "25");
  url.searchParams.set("access_token", token);

  const res = await fetch(url.toString());
  if (!res.ok) {
    console.error(`Failed: ${category} bbox=${bbox} status=${res.status}`);
    return [];
  }
  const data: MapboxResponse = await res.json();
  return data.features ?? [];
}

// Rate limit: 10 req/sec — wait 150ms between calls to stay safe
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) {
    console.error("Missing MAPBOX_ACCESS_TOKEN in .env or .env.local");
    process.exit(1);
  }

  const quadrants = buildQuadrants();
  const allFeatures: MapboxFeature[] = [];

  for (const category of CATEGORIES) {
    for (const bbox of quadrants) {
      console.log(`Fetching ${category} in ${bbox}...`);
      const features = await fetchCategory(category, bbox, token);
      allFeatures.push(...features);
      await delay(150);
    }
  }

  // Dedupe by mapbox_id
  const seen = new Set<string>();
  const unique = allFeatures.filter((f) => {
    const id = f.properties.mapbox_id;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  console.log(
    `Fetched ${allFeatures.length} total, ${unique.length} unique locations`
  );

  // Upsert into DB
  let inserted = 0;
  for (const f of unique) {
    const { mapbox_id, name, full_address, coordinates, poi_category } =
      f.properties;

    await prisma.restaurant.upsert({
      where: { id: mapbox_id },
      update: {
        name,
        longitude: coordinates.longitude,
        latitude: coordinates.latitude,
        address: full_address ?? null,
        category: poi_category?.[0] ?? null,
        syncedAt: new Date(),
      },
      create: {
        id: mapbox_id,
        name,
        longitude: coordinates.longitude,
        latitude: coordinates.latitude,
        address: full_address ?? null,
        category: poi_category?.[0] ?? null,
      },
    });
    inserted++;
  }

  console.log(`Upserted ${inserted} restaurants/bars into database`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
