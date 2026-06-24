"use client";

import { useEffect, useState } from "react";
import { formatIDR, formatDate } from "@/lib/utils";
import { Plus, ArrowRightLeft, PiggyBank, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";

type Transaction = {
  id: number;
  amount: number;
  description: string;
  date: string;
  type: string;
  category?: { name: string; icon: string; color: string } | null;
};

type DashboardData = {
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
  month: number;
  year: number;
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/transactions").then((r) => r.json()).then(setData);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const recent = data.transactions.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link
          href="/transactions"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Transaksi Baru
        </Link>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-2 text-zinc-500 text-sm mb-2">
            <Wallet className="w-4 h-4" />
            Saldo
          </div>
          <p className={`text-xl font-bold ${data.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatIDR(data.balance)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-2 text-zinc-500 text-sm mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            Pemasukan
          </div>
          <p className="text-xl font-bold text-green-600">{formatIDR(data.totalIncome)}</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-2 text-zinc-500 text-sm mb-2">
            <ArrowRightLeft className="w-4 h-4 text-red-500" />
            Pengeluaran
          </div>
          <p className="text-xl font-bold text-red-600">{formatIDR(data.totalExpense)}</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-2 text-zinc-500 text-sm mb-2">
            <PiggyBank className="w-4 h-4 text-blue-500" />
            Bulan
          </div>
          <p className="text-xl font-bold capitalize">
            {new Date(data.year, data.month - 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl border border-zinc-200">
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
          <h2 className="font-semibold">Transaksi Terbaru</h2>
          <Link href="/transactions" className="text-sm text-blue-600 hover:underline">
            Lihat Semua
          </Link>
        </div>
        <div className="divide-y divide-zinc-100">
          {recent.length === 0 && (
            <p className="p-4 text-zinc-400 text-sm text-center">Belum ada transaksi bulan ini</p>
          )}
          {recent.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="text-lg">{t.category?.icon || "📌"}</span>
                <div>
                  <p className="font-medium text-sm">{t.description}</p>
                  <p className="text-xs text-zinc-400">{t.category?.name || "Tanpa kategori"} · {formatDate(t.date)}</p>
                </div>
              </div>
              <p className={`font-semibold text-sm ${t.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                {t.type === "INCOME" ? "+" : "-"}{formatIDR(t.amount)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
