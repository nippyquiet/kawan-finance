import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const investments = await prisma.investment.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json(investments);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const investment = await prisma.investment.create({
    data: {
      name: body.name, type: body.type,
      units: parseFloat(body.units), buyPrice: parseFloat(body.buyPrice),
      currentPrice: parseFloat(body.currentPrice), notes: body.notes || null,
    },
  });
  return Response.json(investment, { status: 201 });
}
