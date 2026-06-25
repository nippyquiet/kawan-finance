import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const pockets = await prisma.pocket.findMany({
    orderBy: { createdAt: "asc" },
  });
  return Response.json(pockets);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const pocket = await prisma.pocket.create({
    data: {
      name: body.name,
      emoji: body.emoji || "👛",
    },
  });
  return Response.json(pocket, { status: 201 });
}
