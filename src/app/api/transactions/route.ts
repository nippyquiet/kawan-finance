import { NextRequest, NextResponse } from "next/server";
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

  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = new Date(dateFrom);
    if (dateTo) where.date.lt = new Date(dateTo);
  } else {
    where.date = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: { category: true },
    orderBy: { date: "desc" },
  });

  // Compute totals in memory (single pass through already-fetched data)
  let totalIncome = 0;
  let totalExpense = 0;
  for (const t of transactions) {
    if (t.type === "INCOME") totalIncome += t.amount;
    else totalExpense += t.amount;
  }

  const response = NextResponse.json({
    transactions,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    month: m,
    year: y,
  });

  response.headers.set("Cache-Control", "public, max-age=5, stale-while-revalidate=30");
  return response;
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
