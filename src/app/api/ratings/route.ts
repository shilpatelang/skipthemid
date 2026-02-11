import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { dishId, value } = await request.json();

  if (!dishId || typeof value !== "number" || value < 1 || value > 5) {
    return NextResponse.json(
      { error: "dishId and value (1-5) are required" },
      { status: 400 }
    );
  }

  const rating = await prisma.rating.upsert({
    where: { dishId_userId: { dishId, userId: session.user.id } },
    update: { value },
    create: { dishId, userId: session.user.id, value },
  });

  return NextResponse.json(rating);
}
