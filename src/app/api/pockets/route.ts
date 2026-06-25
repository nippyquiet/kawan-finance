import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

type SessionUser = {
  id?: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

async function requireUser() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (!user?.id || !user?.email) return null;

  await prisma.user.upsert({
    where: { email: user.email },
    update: { name: user.name ?? null, image: user.image ?? null },
    create: {
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      image: user.image ?? null,
    },
  });

  return { id: user.id, email: user.email };
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const pockets = await prisma.pocket.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  if (pockets.length === 0) {
    const defaultPocket = await prisma.pocket.create({
      data: { name: "Utama", emoji: "👛", isDefault: true, userId: user.id },
    });
    return NextResponse.json([defaultPocket]);
  }

  return NextResponse.json(pockets);
}

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const pocket = await prisma.pocket.create({
    data: {
      name: body.name,
      emoji: body.emoji || "👛",
      userId: user.id,
    },
  });
  return NextResponse.json(pocket, { status: 201 });
}
