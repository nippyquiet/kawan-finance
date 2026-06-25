import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const pocketId = searchParams.get("pocketId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const now = new Date();
  const m = month ? parseInt(month) : now.getMonth() + 1;
  const y = year ? parseInt(year) : now.getFullYear();

  const where: any = {};

  if (pocketId) where.pocketId = parseInt(pocketId);

  // Date filtering: prioritize dateFrom/dateTo over month/year
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = new Date(dateFrom);
    if (dateTo) where.date.lt = new Date(dateTo);
  } else {
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 1);
    where.date = { gte: startDate, lt: endDate };
  }

  const transactions = await prisma.transaction.findMany({
    where,
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
      pocketId: body.pocketId || null,
      attachmentPath: body.attachmentPath || null,
      attachmentType: body.attachmentType || null,
    },
    include: { category: true },
  });
  return Response.json(transaction, { status: 201 });
}
