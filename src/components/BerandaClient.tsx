"use client";

import { formatIDR } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, PiggyBank, TrendingUp, Wallet } from "lucide-react";
import useSWR from "swr";
import Link from "next/link";

type Analytics = {
  currentMonth: { income: number; expense: number; net: number };
  monthlyTrend: { month: number; year: number; income: number; expense: number; net: number }[];
  topCategories: { id: number; name: string; icon: string; total: number }[];
  budget: { total: number; spent: number; remaining: number };
  allTime: { income: number; expense: number; net: number };
};
type Pocket = { id: number; name: string; emoji: string; balance: number; isDefault: boolean };

const fetcher = (url: string) => fetch(url).then(r => r.json());
const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

export default function BerandaClient({
  initialData,
  initialPocket,
}: {
  initialData: Analytics;
  initialPocket: Pocket;
}) {
  // SWR with initial data — instant first render, revalidate in background
  const { data } = useSWR<Analytics>(
    `/api/analytics?pocketId=${initialPocket.id}`,
    fetcher,
    { fallbackData: initialData, revalidateOnFocus: false, dedupingInterval: 5000 }
  );

  if (!data) return <div className="text-center py-12 text-zinc-400 text-sm">Gagal memuat</div>;
  const { currentMonth, monthlyTrend, topCategories, budget } = data;
  const maxTrend = Math.max(...monthlyTrend.map(m => Math.max(m.income, m.expense, 1)), 1);

  return (
    <div className="space-y-5">
      {/* Net Worth Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white">
        <p className="text-sm text-blue-200">Total Kekayaan Bersih</p>
        <p className="text-3xl font-bold mt-1">{formatIDR(data.allTime.net)}</p>
        <div className="flex items-center gap-4 mt-3 text-xs text-blue-100">
          <span className="flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> {formatIDR(data.allTime.income)}</span>
          <span className="flex items-center gap-1"><ArrowDownRight className="w-3 h-3" /> {formatIDR(data.allTime.expense)}</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pemasukan", val: currentMonth.income, color: "green", Icon: ArrowUpRight },
          { label: "Pengeluaran", val: currentMonth.expense, color: "red", Icon: ArrowDownRight },
          { label: "Net", val: currentMonth.net, color: currentMonth.net >= 0 ? "green" : "red", Icon: Wallet },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-zinc-100 p-3 text-center">
            <div className={`w-8 h-8 rounded-full bg-${s.color}-100 flex items-center justify-center mx-auto mb-1`}>
              <s.Icon className={`w-4 h-4 text-${s.color}-600`} />
            </div>
            <p className="text-xs text-zinc-500">{s.label}</p>
            <p className={`font-bold text-sm mt-0.5 ${s.label === "Net" ? (s.val >= 0 ? "text-green-600" : "text-red-600") : ""}`}>
              {s.label === "Net" && s.val >= 0 ? "" : ""}{formatIDR(s.val)}
            </p>
          </div>
        ))}
      </div>

      {/* Monthly Trend Chart */}
      <div className="bg-white rounded-xl border border-zinc-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Tren Bulanan</h3>
          <TrendingUp className="w-4 h-4 text-zinc-400" />
        </div>
        <div className="flex items-end justify-between gap-1 h-40">
          {monthlyTrend.map((m, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <div className="flex flex-col items-center relative w-full" style={{ height: "140px" }}>
                <div className="w-full bg-emerald-400 rounded-t-sm" style={{ height: `${Math.max(2, (m.income / maxTrend) * 100)}px`, opacity: 0.85 }} />
                <div className="w-full bg-red-400 rounded-t-sm -mt-1" style={{ height: `${Math.max(2, (m.expense / maxTrend) * 100)}px`, opacity: 0.75 }} />
              </div>
              <span className="text-[10px] text-zinc-400 font-medium">{MONTHS[m.month - 1]}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-2 text-[10px] text-zinc-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-400" /> Pemasukan</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-400" /> Pengeluaran</span>
        </div>
      </div>

      {/* Budget */}
      {budget.total > 0 && (
        <div className="bg-white rounded-xl border border-zinc-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm flex items-center gap-1.5"><PiggyBank className="w-4 h-4 text-blue-500" /> Budget</h3>
            <Link href="/budget" className="text-xs text-blue-500 hover:underline">Atur →</Link>
          </div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-zinc-500">Terpakai</span>
            <span className="font-medium">{formatIDR(budget.spent)} / {formatIDR(budget.total)}</span>
          </div>
          <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${budget.spent > budget.total ? "bg-red-500" : "bg-blue-500"}`}
              style={{ width: `${Math.min(100, (budget.spent / Math.max(budget.total, 1)) * 100)}%` }} />
          </div>
        </div>
      )}

      {/* Top Categories */}
      {topCategories.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-100 p-4">
          <h3 className="font-semibold text-sm mb-3">Kategori Teratas</h3>
          <div className="space-y-3">
            {topCategories.map((cat) => {
              const pct = currentMonth.expense > 0 ? (cat.total / currentMonth.expense) * 100 : 0;
              return (
                <div key={cat.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2"><span className="text-base">{cat.icon}</span><span className="text-zinc-700">{cat.name}</span></div>
                    <span className="font-medium">{formatIDR(cat.total)}</span>
                  </div>
                  <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {topCategories.length === 0 && currentMonth.income === 0 && currentMonth.expense === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-zinc-100">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-zinc-500 text-sm">Belum ada data bulan ini</p>
          <Link href="/transactions?add=1" className="inline-block mt-3 bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium">Transaksi Pertama</Link>
        </div>
      )}
    </div>
  );
}
