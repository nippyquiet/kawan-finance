import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const debts = await prisma.debt.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json(debts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const debt = await prisma.debt.create({ data: body });
  return Response.json(debt, { status: 201 });
}
