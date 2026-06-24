"use client";

import { useEffect, useState } from "react";
import { formatIDR, getCurrentMonth, getCurrentYear, getMonthName, formatNumberInput } from "@/lib/utils";
import { Plus, X } from "lucide-react";

type Category = { id: number; name: string; icon: string; color: string };
type Budget = { id: number; categoryId: number; month: number; year: number; amount: number; category: Category };

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [month, setMonth] = useState(getCurrentMonth());
  const [year, setYear] = useState(getCurrentYear());
  const [txSpent, setTxSpent] = useState<Record<number, number>>({});
  const [form, setForm] = useState({ categoryId: "", amount: "" });

  const load = async () => {
    const [budgetRes, catRes, txRes] = await Promise.all([
      fetch("/api/budgets").then(r => r.json()),
      fetch("/api/categories").then(r => r.json()),
      fetch(`/api/transactions?month=${month}&year=${year}`).then(r => r.json()),
    ]);
    setBudgets(budgetRes);
    setCategories(catRes.filter((c: Category) => c.name !== "Lainnya (Pemasukan)"));
    // Calculate spent per category
    const spent: Record<number, number> = {};
    for (const tx of txRes.transactions || []) {
      if (tx.type === "EXPENSE" && tx.categoryId) {
        spent[tx.categoryId] = (spent[tx.categoryId] || 0) + tx.amount;
      }
    }
    setTxSpent(spent);
  };

  useEffect(() => { load(); }, [month, year]);

  const submit = async () => {
    if (!form.categoryId || !form.amount) return;
    await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: parseInt(form.categoryId), month, year, amount: Math.round(parseFloat(form.amount.replace(/[^0-9]/g, ""))) }),
    });
    setForm({ categoryId: "", amount: "" });
    setShowForm(false);
    load();
  };

  const expenseCats = categories.filter(c => c.name !== "Lainnya (Pemasukan)");
  const budgetData = expenseCats.map(cat => {
    const budget = budgets.find(b => b.categoryId === cat.id && b.month === month && b.year === year);
    const spent = txSpent[cat.id] || 0;
    return { ...cat, budgetAmount: budget?.amount || 0, spent, remaining: (budget?.amount || 0) - spent };
  }).filter(c => c.budgetAmount > 0 || c.spent > 0);

  const totalBudget = budgetData.reduce((s, b) => s + b.budgetAmount, 0);
  const totalSpent = budgetData.reduce((s, b) => s + b.spent, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Budget</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Set Budget
        </button>
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-2">
        <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="px-3 py-2 border border-zinc-200 rounded-lg text-sm">
          {Array.from({length: 12}, (_, i) => i + 1).map(m => (
            <option key={m} value={m}>{getMonthName(m)}</option>
          ))}
        </select>
        <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="px-3 py-2 border border-zinc-200 rounded-lg text-sm">
          {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Summary */}
      {budgetData.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <p className="text-xs text-zinc-500 mb-1">Total Budget</p>
            <p className="text-lg font-bold">{formatIDR(totalBudget)}</p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <p className="text-xs text-zinc-500 mb-1">Total Terpakai</p>
            <p className="text-lg font-bold">{formatIDR(totalSpent)}</p>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-zinc-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Set Budget {getMonthName(month)} {year}</h2>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-zinc-400" /></button>
          </div>
          <select value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm">
            <option value="">Pilih kategori</option>
            {expenseCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <input placeholder="Batas budget (Rp)" value={form.amount} onChange={e => setForm({...form, amount: formatNumberInput(e.target.value)})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
          <button onClick={submit} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Simpan</button>
        </div>
      )}

      {/* Budget list */}
      <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100">
        {budgetData.length === 0 && <p className="p-4 text-zinc-400 text-sm text-center">Belum ada budget. Klik &quot;Set Budget&quot; untuk mulai.</p>}
        {budgetData.map(b => {
          const pct = b.budgetAmount > 0 ? Math.min(100, Math.round((b.spent / b.budgetAmount) * 100)) : 0;
          const over = b.spent > b.budgetAmount && b.budgetAmount > 0;
          return (
            <div key={b.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span>{b.icon}</span>
                  <p className="font-medium text-sm">{b.name}</p>
                </div>
                <p className={`text-sm font-semibold ${over ? "text-red-600" : "text-green-600"}`}>
                  {formatIDR(b.spent)} / {formatIDR(b.budgetAmount)}
                </p>
              </div>
              <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${over ? "bg-red-500" : "bg-blue-500"}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
