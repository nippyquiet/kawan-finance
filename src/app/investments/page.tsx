"use client";

import { useEffect, useState } from "react";
import { formatIDR } from "@/lib/utils";
import { Plus, X, TrendingUp, TrendingDown, Pencil } from "lucide-react";

type Investment = {
  id: number; name: string; type: string; units: number;
  buyPrice: number; currentPrice: number; notes: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  STOCK: "Saham", CRYPTO: "Kripto", REIT: "REIT/DPLK",
  GOLD: "Emas", DEPOSIT: "Deposito", OTHER: "Lainnya",
};

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", type: "STOCK", units: "", buyPrice: "", currentPrice: "", notes: "" });

  const load = () => { fetch("/api/investments").then(r => r.json()).then(setInvestments).catch(() => {}); };
  useEffect(() => { load(); }, []);

  const openEdit = (inv: Investment) => {
    setEditId(inv.id);
    setForm({ name: inv.name, type: inv.type, units: String(inv.units), buyPrice: String(inv.buyPrice), currentPrice: String(inv.currentPrice), notes: inv.notes || "" });
    setShowForm(true);
  };

  const resetForm = () => { setForm({ name: "", type: "STOCK", units: "", buyPrice: "", currentPrice: "", notes: "" }); setEditId(null); };

  const submit = async () => {
    if (!form.name || !form.units || !form.buyPrice) return;
    const payload = { name: form.name, type: form.type, units: form.units, buyPrice: form.buyPrice, currentPrice: form.currentPrice || form.buyPrice, notes: form.notes || null };

    if (editId) {
      await fetch(`/api/investments/${editId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } else {
      await fetch("/api/investments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    resetForm();
    setShowForm(false);
    load();
  };

  const updatePrice = async (id: number, currentPrice: string) => {
    await fetch(`/api/investments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPrice: parseFloat(currentPrice) }),
    });
    load();
  };

  const remove = async (id: number) => {
    await fetch(`/api/investments/${id}`, { method: "DELETE" });
    load();
  };

  const totalCost = investments.reduce((s, i) => s + i.units * i.buyPrice, 0);
  const totalValue = investments.reduce((s, i) => s + i.units * i.currentPrice, 0);
  const totalPL = totalValue - totalCost;
  const totalPLPercent = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Investasi</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <p className="text-xs text-zinc-500 mb-1">Total Modal</p>
          <p className="text-lg font-bold">{formatIDR(Math.round(totalCost))}</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <p className="text-xs text-zinc-500 mb-1">Nilai Sekarang</p>
          <p className="text-lg font-bold">{formatIDR(Math.round(totalValue))}</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <p className="text-xs text-zinc-500 mb-1">Untung/Rugi</p>
          <p className={`text-lg font-bold flex items-center gap-1 ${totalPL >= 0 ? "text-green-600" : "text-red-600"}`}>
            {totalPL >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {formatIDR(Math.round(totalPL))} ({totalPLPercent.toFixed(1)}%)
          </p>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-zinc-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{editId ? "Edit Investasi" : "Tambah Investasi"}</h2>
            <button onClick={() => { resetForm(); setShowForm(false); }}><X className="w-4 h-4 text-zinc-400" /></button>
          </div>
          <input placeholder="Nama (contoh: BBCA, Emas Antam)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm">
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input placeholder="Jumlah unit (contoh: 10 lot = 10)" value={form.units} onChange={e => setForm({...form, units: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
          <input placeholder="Harga beli per unit (Rp)" value={form.buyPrice} onChange={e => setForm({...form, buyPrice: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
          <input placeholder="Harga sekarang per unit (kosongin = sama)" value={form.currentPrice} onChange={e => setForm({...form, currentPrice: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
          <input placeholder="Catatan" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
          <button onClick={submit} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Simpan</button>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100">
        {investments.length === 0 && <p className="p-4 text-zinc-400 text-sm text-center">Belum ada investasi</p>}
        {investments.map(i => {
          const cost = i.units * i.buyPrice;
          const value = i.units * i.currentPrice;
          const pl = value - cost;
          const plPercent = cost > 0 ? (pl / cost) * 100 : 0;
          return (
            <div key={i.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{i.name}</p>
                  <p className="text-xs text-zinc-400">{TYPE_LABELS[i.type] || i.type} · {i.units} unit</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold ${pl >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatIDR(Math.round(pl))} ({plPercent.toFixed(1)}%)
                  </p>
                  <button onClick={() => openEdit(i)} className="text-zinc-300 hover:text-blue-500"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => remove(i.id)} className="text-zinc-300 hover:text-red-500"><X className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400">
                <span>Modal: {formatIDR(Math.round(cost))}</span>
                <span>Nilai: {formatIDR(Math.round(value))}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
