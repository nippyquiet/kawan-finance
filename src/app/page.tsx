"use client";

import { useEffect, useState } from "react";
import { usePocket } from "@/lib/PocketContext";
import { formatIDR, formatDate } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import Link from "next/link";

type Transaction = {
  id: number; amount: number; description: string; date: string;
  type: string; category?: { id: number; name: string; icon: string } | null;
};

const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

export default function Home() {
  const { activePocket } = usePocket();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  useEffect(() => {
    if (!activePocket) return;
    setLoading(true);
    fetch(`/api/transactions?month=${month}&year=${year}&pocketId=${activePocket.id}`)
      .then(r => r.json())
      .then(data => {
        setTransactions(data.transactions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activePocket, month, year]);

  // Summary
  const totalIncome = transactions.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  const netTotal = totalIncome - totalExpense;
  const openingBalance = activePocket ? activePocket.balance - netTotal : 0;

  // Group by date
  const grouped: Record<string, Transaction[]> = {};
  for (const t of transactions) {
    const key = t.date.split("T")[0];
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  }

  return (
    <div className="space-y-5">
      {/* Month tabs */}
      <div className="flex gap-4 text-sm border-b border-zinc-100 pb-2">
        {["BULAN LALU", "BULAN INI", "MENDATANG"].map((tab, i) => (
          <button
            key={tab}
            className={`pb-2 -mb-0.5 font-medium ${
              i === 1 ? "text-blue-600 border-b-2 border-blue-600" : "text-zinc-400"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500">Saldo Awal</span>
          <span className={openingBalance < 0 ? "text-red-500" : "text-green-500"}>
            {formatIDR(openingBalance)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500">Mutasi Masuk</span>
          <span className="text-green-600 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> {formatIDR(totalIncome)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500">Mutasi Keluar</span>
          <span className="text-red-600 flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5" /> {formatIDR(totalExpense)}
          </span>
        </div>
        <hr className="border-zinc-100" />
        <div className="flex items-center justify-between font-semibold">
          <span>Net Total</span>
          <span className={netTotal >= 0 ? "text-green-600" : "text-red-600"}>
            {netTotal >= 0 ? "+" : ""}{formatIDR(netTotal)}
          </span>
        </div>
        <Link href="/transactions" className="block text-xs text-blue-500 mt-1 hover:underline">
          Lihat laporan periode ini →
        </Link>
      </div>

      {/* Transaction list */}
      {loading ? (
        <p className="text-zinc-400 text-sm text-center py-8">Memuat...</p>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12">
          <p className="text-3xl mb-2">📭</p>
          <p className="text-zinc-400 text-sm">Belum ada transaksi bulan ini</p>
          <Link href="/transactions?add=1" className="inline-block mt-3 bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium">
            Tambah Transaksi
          </Link>
        </div>
      ) : (
        Object.entries(grouped).map(([dateKey, txs]) => {
          const d = new Date(dateKey + "T00:00:00");
          const dayTotal = txs.reduce((s, t) => s + (t.type === "INCOME" ? t.amount : -t.amount), 0);
          const isToday = dateKey === new Date().toISOString().split("T")[0];
          const isYesterday = dateKey === new Date(Date.now() - 86400000).toISOString().split("T")[0];
          const label = isToday ? "Hari Ini" : isYesterday ? "Kemarin" : `${MONTHS[d.getMonth()]} ${d.getDate()}`;

          return (
            <div key={dateKey}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-medium text-zinc-500">{label}</h3>
                <span className={`text-xs font-semibold ${dayTotal >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {dayTotal >= 0 ? "+" : ""}{formatIDR(dayTotal)}
                </span>
              </div>
              <div className="bg-white rounded-2xl border border-zinc-100 divide-y divide-zinc-50">
                {txs.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base ${
                      tx.type === "INCOME" ? "bg-green-100" : "bg-blue-100"
                    }`}>
                      {tx.category?.icon || (tx.type === "INCOME" ? "💰" : "💳")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description || "Tanpa keterangan"}</p>
                      <p className="text-xs text-zinc-400">{tx.category?.name || "Lainnya"}</p>
                    </div>
                    <p className={`text-sm font-semibold shrink-0 ${tx.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                      {tx.type === "INCOME" ? "+" : "-"}{formatIDR(tx.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
