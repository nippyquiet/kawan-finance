import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

async function getAnalytics(pocketId: number | null) {
  const wherePocket = pocketId ? { pocketId } : {};

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const sixMonthsAgo = new Date(currentYear, currentMonth - 6, 1);
  const endOfCurrentMonth = new Date(currentYear, currentMonth, 1);

  // Single query for all recent transactions
  const allRecentTx = await prisma.transaction.findMany({
    where: { ...wherePocket, date: { gte: sixMonthsAgo, lt: endOfCurrentMonth } },
    select: { id: true, amount: true, type: true, date: true, categoryId: true },
  });

  const byMonth: Record<string, { income: number; expense: number }> = {};
  const catSpending: Record<number, number> = {};

  for (const tx of allRecentTx) {
    const m = `${tx.date.getFullYear()}-${tx.date.getMonth() + 1}`;
    if (!byMonth[m]) byMonth[m] = { income: 0, expense: 0 };
    if (tx.type === "INCOME") byMonth[m].income += tx.amount;
    else { byMonth[m].expense += tx.amount; if (tx.categoryId) catSpending[tx.categoryId] = (catSpending[tx.categoryId] || 0) + tx.amount; }
  }

  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - 1 - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const data = byMonth[key] || { income: 0, expense: 0 };
    monthlyTrend.push({ month: d.getMonth() + 1, year: d.getFullYear(), income: data.income, expense: data.expense, net: data.income - data.expense });
  }

  const thisMonthKey = `${currentYear}-${currentMonth}`;
  const thisMonthData = byMonth[thisMonthKey] || { income: 0, expense: 0 };

  const catIds = Object.keys(catSpending).map(Number);
  const catMap: Record<number, { name: string; icon: string }> = {};
  if (catIds.length > 0) {
    const cats = await prisma.category.findMany({ where: { id: { in: catIds } }, select: { id: true, name: true, icon: true } });
    for (const c of cats) catMap[c.id] = { name: c.name, icon: c.icon || "📌" };
  }
  const topCategories = Object.entries(catSpending).sort(([, a], [, b]) => b - a).slice(0, 5)
    .map(([id, total]) => ({ id: parseInt(id), total, name: catMap[parseInt(id)]?.name || "", icon: catMap[parseInt(id)]?.icon || "📌" }));

  const budgets = await prisma.budget.findMany({ where: { ...wherePocket, month: currentMonth, year: currentYear }, select: { amount: true } });
  const budgetTotal = budgets.reduce((s, b) => s + b.amount, 0);

  const [allTimeIncome, allTimeExpense] = await Promise.all([
    prisma.transaction.aggregate({ where: { ...wherePocket, type: "INCOME" }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { ...wherePocket, type: "EXPENSE" }, _sum: { amount: true } }),
  ]);

  return {
    currentMonth: { income: thisMonthData.income, expense: thisMonthData.expense, net: thisMonthData.income - thisMonthData.expense },
    monthlyTrend,
    topCategories,
    budget: { total: budgetTotal, spent: thisMonthData.expense, remaining: budgetTotal - thisMonthData.expense },
    allTime: { income: allTimeIncome._sum.amount || 0, expense: allTimeExpense._sum.amount || 0, net: (allTimeIncome._sum.amount || 0) - (allTimeExpense._sum.amount || 0) },
  };
}

const getCachedAnalytics = unstable_cache(
  async (pocketId: number | null) => getAnalytics(pocketId),
  ["analytics"],
  { revalidate: 15, tags: ["analytics"] }
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pocketId = searchParams.get("pocketId");
  const pid = pocketId ? parseInt(pocketId) : null;

  const data = await unstable_cache(
    async (pid: number | null) => getAnalytics(pid),
    ["analytics", `p${pid ?? "all"}`],
    { revalidate: 15 }
  )(pid);

  const response = NextResponse.json(data);
  response.headers.set("Cache-Control", "public, max-age=10, stale-while-revalidate=30");
  return response;
}
