import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toFeatureCollection } from "@/lib/geojson";

export async function GET() {
  const restaurants = await prisma.restaurant.findMany({
    include: { dishes: { select: { tag: true } } },
  });

  return NextResponse.json(toFeatureCollection(restaurants));
}
