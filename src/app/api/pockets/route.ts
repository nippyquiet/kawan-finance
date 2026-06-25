import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  const pockets = await prisma.pocket.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  // Auto-create default pocket for new users
  if (pockets.length === 0) {
    const defaultPocket = await prisma.pocket.create({
      data: { name: "Utama", emoji: "👛", isDefault: true, userId: session.user.id },
    });
    return NextResponse.json([defaultPocket]);
  }

  return NextResponse.json(pockets);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const pocket = await prisma.pocket.create({
    data: {
      name: body.name,
      emoji: body.emoji || "👛",
      userId: session.user.id,
    },
  });
  return NextResponse.json(pocket, { status: 201 });
}
