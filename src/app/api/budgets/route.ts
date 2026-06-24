import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const budgets = await prisma.budget.findMany({
    include: { category: true },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
  return Response.json(budgets);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const existing = await prisma.budget.findUnique({
    where: { month_year_categoryId: { month: body.month, year: body.year, categoryId: body.categoryId } },
  });
  if (existing) {
    const budget = await prisma.budget.update({
      where: { id: existing.id },
      data: { amount: body.amount },
    });
    return Response.json(budget);
  }
  const budget = await prisma.budget.create({ data: body });
  return Response.json(budget, { status: 201 });
}
