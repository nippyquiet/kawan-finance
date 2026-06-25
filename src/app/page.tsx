import { prisma } from "@/lib/prisma";
import BerandaClient from "@/components/BerandaClient";

// ISR: revalidate every 60s, first request is instant from cache
export const revalidate = 60;

async function getAnalytics(pocketId: number) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const sixMonthsAgo = new Date(currentYear, currentMonth - 6, 1);
  const endOfCurrentMonth = new Date(currentYear, currentMonth, 1);

  const allRecentTx = await prisma.transaction.findMany({
    where: { pocketId, date: { gte: sixMonthsAgo, lt: endOfCurrentMonth } },
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

  const budgets = await prisma.budget.findMany({ where: { pocketId, month: currentMonth, year: currentYear }, select: { amount: true } });
  const budgetTotal = budgets.reduce((s, b) => s + b.amount, 0);

  const [allTimeIncome, allTimeExpense] = await Promise.all([
    prisma.transaction.aggregate({ where: { pocketId, type: "INCOME" }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { pocketId, type: "EXPENSE" }, _sum: { amount: true } }),
  ]);

  return {
    currentMonth: { income: thisMonthData.income, expense: thisMonthData.expense, net: thisMonthData.income - thisMonthData.expense },
    monthlyTrend, topCategories,
    budget: { total: budgetTotal, spent: thisMonthData.expense, remaining: budgetTotal - thisMonthData.expense },
    allTime: { income: allTimeIncome._sum.amount || 0, expense: allTimeExpense._sum.amount || 0, net: (allTimeIncome._sum.amount || 0) - (allTimeExpense._sum.amount || 0) },
  };
}

export default async function HomePage() {
  const [pockets, defaultAnalytics] = await Promise.all([
    prisma.pocket.findMany({ orderBy: { createdAt: "asc" } }),
    getAnalytics(1),
  ]);

  const defaultPocket = pockets.find(p => p.isDefault) || pockets[0] || { id: 1, name: "KAWAN UANG", emoji: "👛", balance: 0, isDefault: true };

  return <BerandaClient initialData={defaultAnalytics} initialPocket={defaultPocket} />;
}
