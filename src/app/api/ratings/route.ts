import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { dishId, value } = await request.json();

  if (
    !dishId ||
    typeof value !== "number" ||
    value < 0.5 ||
    value > 5 ||
    value % 0.5 !== 0
  ) {
    return NextResponse.json(
      { error: "dishId and value (0.5–5 in half-star increments) are required" },
      { status: 400 }
    );
  }

  try {
    const rating = await prisma.rating.upsert({
      where: { dishId_userId: { dishId, userId: session.user.id } },
      update: { value },
      create: { dishId, userId: session.user.id, value },
    });

    return NextResponse.json(rating);
  } catch {
    return NextResponse.json(
      { error: "Failed to save rating. Try signing out and back in." },
      { status: 500 }
    );
  }
}
