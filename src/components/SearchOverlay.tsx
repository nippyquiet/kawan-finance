"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, ArrowRightLeft } from "lucide-react";
import { formatIDR, formatDate } from "@/lib/utils";
import { usePocket } from "@/lib/PocketContext";
import Link from "next/link";

type TxResult = {
  id: number; amount: number; description: string; date: string;
  type: string; category?: { name: string; icon: string } | null;
};

export function SearchOverlay() {
  const { activePocket } = usePocket();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<TxResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else { setQ(""); setResults([]); }
  }, [open]);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (q.length < 2 || !activePocket) { setResults([]); return; }
    setLoading(true);
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/transactions?pocketId=${activePocket.id}&dateFrom=2000-01-01`);
        const data = await res.json();
        const txs: TxResult[] = data.transactions || [];
        const filtered = txs.filter(t => t.description.toLowerCase().includes(q.toLowerCase()));
        setResults(filtered.slice(0, 20));
      } catch {}
      setLoading(false);
    }, 300);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [q, activePocket]);

  return (
    <>
      {/* Trigger */}
      <button onClick={() => setOpen(true)} className="p-1">
        <Search className="w-5 h-5 text-zinc-500" />
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col" onClick={() => setOpen(false)}>
          <div className="sticky top-0 bg-white border-b border-zinc-100 p-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Cari transaksi..."
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-100 rounded-xl text-sm outline-none"
                  autoFocus
                />
              </div>
              <button onClick={() => setOpen(false)} className="text-sm text-zinc-500 font-medium">{q ? "Tutup" : "Batal"}</button>
            </div>
          </div>

          <div className="flex-1 overflow-auto" onClick={e => e.stopPropagation()}>
            {loading && <p className="text-center text-zinc-400 text-sm py-8">Mencari...</p>}
            {!loading && q.length >= 2 && results.length === 0 && (
              <p className="text-center text-zinc-400 text-sm py-8">Tidak ditemukan</p>
            )}
            {!loading && q.length < 2 && (
              <p className="text-center text-zinc-400 text-sm py-8">Ketik minimal 2 huruf</p>
            )}
            {results.map(tx => (
              <Link
                key={tx.id}
                href="/transactions"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 border-b border-zinc-50 hover:bg-zinc-50"
              >
                <span className="text-lg">{tx.category?.icon || (tx.type === "INCOME" ? "💰" : "💳")}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tx.description}</p>
                  <p className="text-xs text-zinc-400">{tx.category?.name} · {formatDate(tx.date)}</p>
                </div>
                <span className={`text-sm font-semibold ${tx.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                  {tx.type === "INCOME" ? "+" : "-"}{formatIDR(tx.amount)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
