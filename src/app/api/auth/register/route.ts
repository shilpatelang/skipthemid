import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const { email, password, firstName, lastName } = await request.json();

  if (!email || !password || !firstName) {
    return NextResponse.json(
      { error: "Email, password, and first name are required" },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 },
    );
  }

  const hashed = await bcrypt.hash(password, 10);
  const name = lastName ? `${firstName} ${lastName}` : firstName;

  const user = await prisma.user.create({
    data: { email, password: hashed, name },
  });

  return NextResponse.json({ id: user.id, email: user.email, name: user.name });
}
