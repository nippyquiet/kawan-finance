import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const now = new Date();
  const m = month ? parseInt(month) : now.getMonth() + 1;
  const y = year ? parseInt(year) : now.getFullYear();

  const startDate = new Date(y, m - 1, 1);
  const endDate = new Date(y, m, 1);

  const transactions = await prisma.transaction.findMany({
    where: {
      date: { gte: startDate, lt: endDate },
    },
    include: { category: true },
    orderBy: { date: "desc" },
  });

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  return Response.json({
    transactions,
    totalIncome,
    totalExpense,
    balance,
    month: m,
    year: y,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const transaction = await prisma.transaction.create({
    data: {
      amount: body.amount,
      description: body.description,
      date: new Date(body.date),
      type: body.type,
      categoryId: body.categoryId || null,
    },
    include: { category: true },
  });
  return Response.json(transaction, { status: 201 });
}
