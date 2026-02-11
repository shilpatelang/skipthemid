import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toDishFeatureCollection } from "@/lib/geojson";

export async function GET() {
  const dishes = await prisma.dish.findMany({
    include: { ratings: { select: { value: true } } },
  });

  return NextResponse.json(toDishFeatureCollection(dishes));
}
