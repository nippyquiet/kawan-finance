"use client";

import { useEffect, useState } from "react";
import { formatIDR, formatDate } from "@/lib/utils";
import { Plus, X, CheckCircle, Pencil } from "lucide-react";

type Debt = {
  id: number; name: string; type: string; amount: number;
  remainingAmount: number; dueDate: string | null; notes: string | null; isPaid: boolean;
};

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", type: "OWE", amount: "", remainingAmount: "", dueDate: "", notes: "" });

  const load = () => { fetch("/api/debts").then(r => r.json()).then(setDebts).catch(() => {}); };
  useEffect(() => { load(); }, []);

  const openEdit = (d: Debt) => {
    setEditId(d.id);
    setForm({ name: d.name, type: d.type, amount: String(d.amount), remainingAmount: String(d.remainingAmount), dueDate: d.dueDate ? d.dueDate.split("T")[0] : "", notes: d.notes || "" });
    setShowForm(true);
  };

  const resetForm = () => { setForm({ name: "", type: "OWE", amount: "", remainingAmount: "", dueDate: "", notes: "" }); setEditId(null); };

  const submit = async () => {
    const amount = Math.round(parseFloat(form.amount.replace(/[^0-9]/g, "")));
    if (!amount || !form.name) return;
    const remaining = form.remainingAmount ? Math.round(parseFloat(form.remainingAmount.replace(/[^0-9]/g, ""))) : amount;
    const payload = { name: form.name, type: form.type, amount, remainingAmount: remaining, dueDate: form.dueDate || null, notes: form.notes || null };

    if (editId) {
      await fetch(`/api/debts/${editId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } else {
      await fetch("/api/debts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    resetForm();
    setShowForm(false);
    load();
  };

  const markPaid = async (id: number) => {
    await fetch(`/api/debts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPaid: true }) });
    load();
  };

  const remove = async (id: number) => {
    await fetch(`/api/debts/${id}`, { method: "DELETE" });
    load();
  };

  const active = debts.filter(d => !d.isPaid);
  const totalOwe = active.filter(d => d.type === "OWE").reduce((s, d) => s + d.remainingAmount, 0);
  const totalOwed = active.filter(d => d.type === "OWED").reduce((s, d) => s + d.remainingAmount, 0);
  const netDebt = totalOwe - totalOwed;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Hutang & Piutang</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <p className="text-xs text-zinc-500 mb-1">Hutang (gua)</p>
          <p className="text-lg font-bold text-red-600">{formatIDR(totalOwe)}</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <p className="text-xs text-zinc-500 mb-1">Piutang (orang)</p>
          <p className="text-lg font-bold text-green-600">{formatIDR(totalOwed)}</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <p className="text-xs text-zinc-500 mb-1">Net</p>
          <p className={`text-lg font-bold ${netDebt <= 0 ? "text-green-600" : "text-red-600"}`}>{formatIDR(Math.abs(netDebt))}</p>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-zinc-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{editId ? "Edit Hutang/Piutang" : "Tambah Hutang/Piutang"}</h2>
            <button onClick={() => { resetForm(); setShowForm(false); }}><X className="w-4 h-4 text-zinc-400" /></button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setForm({...form, type: "OWE"})} className={`flex-1 py-2 rounded-lg text-sm font-medium ${form.type === "OWE" ? "bg-red-100 text-red-700" : "bg-zinc-100 text-zinc-600"}`}>Gua Hutang</button>
            <button onClick={() => setForm({...form, type: "OWED"})} className={`flex-1 py-2 rounded-lg text-sm font-medium ${form.type === "OWED" ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-600"}`}>Dihutangi</button>
          </div>
          <input placeholder="Nama orang" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
          <input placeholder="Total nominal (Rp)" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
          <input placeholder="Sisa (Rp) — kosongin kalo=total" value={form.remainingAmount} onChange={e => setForm({...form, remainingAmount: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
          <input type="date" placeholder="Jatuh tempo" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
          <textarea placeholder="Catatan" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" rows={2} />
          <button onClick={submit} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Simpan</button>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100">
        {active.length === 0 && <p className="p-4 text-zinc-400 text-sm text-center">Belum ada hutang/piutang aktif</p>}
        {active.map(d => (
          <div key={d.id} className="flex items-center justify-between p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{d.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${d.type === "OWE" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                  {d.type === "OWE" ? "Hutang" : "Piutang"}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {d.notes && `${d.notes} · `}Sisa: {formatIDR(d.remainingAmount)} dari {formatIDR(d.amount)}
                {d.dueDate && ` · Jatuh tempo ${formatDate(d.dueDate)}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => openEdit(d)} className="text-zinc-300 hover:text-blue-500" title="Edit">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => markPaid(d.id)} className="text-green-500 hover:text-green-700" title="Lunas">
                <CheckCircle className="w-4 h-4" />
              </button>
              <button onClick={() => remove(d.id)} className="text-zinc-300 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Paid history */}
      {debts.filter(d => d.isPaid).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-zinc-500 mb-2">Riwayat Lunas</h3>
          <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100">
            {debts.filter(d => d.isPaid).map(d => (
              <div key={d.id} className="flex items-center justify-between p-3">
                <p className="text-sm text-zinc-400 line-through">{d.name}</p>
                <p className="text-xs text-green-600">{formatIDR(d.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
