import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pocketId = searchParams.get("pocketId");

  const wherePocket = pocketId ? { pocketId: parseInt(pocketId) } : {};

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Current month stats
  const startThisMonth = new Date(currentYear, currentMonth - 1, 1);
  const endThisMonth = new Date(currentYear, currentMonth, 1);
  const thisMonthTx = await prisma.transaction.findMany({
    where: { ...wherePocket, date: { gte: startThisMonth, lt: endThisMonth } },
  });
  const thisIncome = thisMonthTx.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const thisExpense = thisMonthTx.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);

  // Last 6 months trend
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - 1 - i, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);
    const txs = await prisma.transaction.findMany({
      where: { ...wherePocket, date: { gte: start, lt: end } },
    });
    const income = txs.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
    monthlyTrend.push({ month: m, year: y, income, expense, net: income - expense });
  }

  // Top spending categories this month
  const catSpending: Record<number, { name: string; icon: string; total: number }> = {};
  for (const tx of thisMonthTx.filter(t => t.type === "EXPENSE")) {
    if (tx.categoryId) {
      if (!catSpending[tx.categoryId]) {
        catSpending[tx.categoryId] = { name: "", icon: "", total: 0 };
      }
      catSpending[tx.categoryId].total += tx.amount;
    }
  }
  // Get category names
  const catIds = Object.keys(catSpending).map(Number);
  if (catIds.length > 0) {
    const cats = await prisma.category.findMany({ where: { id: { in: catIds } } });
    for (const cat of cats) {
      if (catSpending[cat.id]) {
        catSpending[cat.id].name = cat.name;
        catSpending[cat.id].icon = cat.icon || "📌";
      }
    }
  }
  const topCategories = Object.entries(catSpending)
    .map(([id, c]) => ({ id: parseInt(id), ...c }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Budget stats
  const budgets = await prisma.budget.findMany({
    where: { ...wherePocket, month: currentMonth, year: currentYear },
    include: { category: true },
  });
  const budgetTotal = budgets.reduce((s, b) => s + b.amount, 0);
  const budgetSpent = thisMonthTx
    .filter(t => t.type === "EXPENSE" && t.categoryId)
    .reduce((s, t) => s + t.amount, 0);

  // Total balance (pocket balance + all time net)
  const allTxs = await prisma.transaction.findMany({ where: wherePocket });
  const allTimeIncome = allTxs.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const allTimeExpense = allTxs.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);

  return Response.json({
    currentMonth: { income: thisIncome, expense: thisExpense, net: thisIncome - thisExpense },
    monthlyTrend,
    topCategories,
    budget: { total: budgetTotal, spent: budgetSpent, remaining: budgetTotal - budgetSpent },
    allTime: { income: allTimeIncome, expense: allTimeExpense, net: allTimeIncome - allTimeExpense },
  });
}
