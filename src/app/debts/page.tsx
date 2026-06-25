"use client";

import { useEffect, useState } from "react";
import { usePocket } from "@/lib/PocketContext";
import { formatIDR, formatNumberInput, formatDate } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { Plus, X, Pencil, CheckCircle, CreditCard, RefreshCw, Globe, Wallet, Settings } from "lucide-react";

// === Types ===
type Debt = {
  id: number; name: string; type: string; amount: number;
  remainingAmount: number; dueDate: string | null; notes: string | null; isPaid: boolean;
};
type Recurring = {
  id: number; description: string; amount: number; type: string; frequency: string;
  isActive: boolean; dayOfMonth: number | null; dayOfWeek: number | null;
  category?: { name: string; icon: string } | null; notes: string | null; nextDate: string | null;
};

// === Components ===
function DebtSection({ pocketId, t }: { pocketId: number; t: (k: string) => string }) {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", type: "OWE", amount: "", remainingAmount: "", dueDate: "", notes: "" });

  const load = () => fetch("/api/debts").then(r => r.json()).then(setDebts);
  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm({ name: "", type: "OWE", amount: "", remainingAmount: "", dueDate: "", notes: "" }); setEditId(null); };
  const submit = async () => {
    const amount = Math.round(parseFloat(form.amount.replace(/[^0-9]/g, "")));
    if (!amount || !form.name) return;
    const remaining = form.remainingAmount ? Math.round(parseFloat(form.remainingAmount.replace(/[^0-9]/g, ""))) : amount;
    const payload = { name: form.name, type: form.type, amount, remainingAmount: remaining, dueDate: form.dueDate || null, notes: form.notes || null, pocketId };
    if (editId) await fetch(`/api/debts/${editId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    else await fetch("/api/debts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    resetForm(); setShowForm(false); load();
  };
  const markPaid = async (id: number) => { await fetch(`/api/debts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPaid: true }) }); load(); };
  const remove = async (id: number) => { await fetch(`/api/debts/${id}`, { method: "DELETE" }); load(); };

  const active = debts.filter(d => !d.isPaid);
  const totalOwe = active.filter(d => d.type === "OWE").reduce((s, d) => s + d.remainingAmount, 0);
  const totalOwed = active.filter(d => d.type === "OWED").reduce((s, d) => s + d.remainingAmount, 0);
  const netDebt = totalOwe - totalOwed;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{t("debt.title")}</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs font-medium"><Plus className="w-3 h-3" /> {t("add")}</button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-red-50 rounded-xl p-3 text-center"><p className="text-[10px] text-red-600">{t("debt.you_owe")}</p><p className="font-bold text-red-600 text-sm">{formatIDR(totalOwe)}</p></div>
        <div className="bg-green-50 rounded-xl p-3 text-center"><p className="text-[10px] text-green-600">{t("debt.you_owed")}</p><p className="font-bold text-green-600 text-sm">{formatIDR(totalOwed)}</p></div>
        <div className="bg-zinc-50 rounded-xl p-3 text-center"><p className="text-[10px] text-zinc-500">{t("debt.net")}</p><p className={`font-bold text-sm ${netDebt <= 0 ? "text-green-600" : "text-red-600"}`}>{formatIDR(Math.abs(netDebt))}</p></div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-2">
          <div className="flex gap-2">
            <button onClick={() => setForm({...form, type: "OWE"})} className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${form.type === "OWE" ? "bg-red-100 text-red-700" : "bg-zinc-100 text-zinc-500"}`}>{t("debt.owe")}</button>
            <button onClick={() => setForm({...form, type: "OWED"})} className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${form.type === "OWED" ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"}`}>{t("debt.owed")}</button>
          </div>
          <input placeholder={t("debt.person_name")} value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
          <input placeholder={t("debt.total_amount")} value={form.amount} onChange={e => setForm({...form, amount: formatNumberInput(e.target.value)})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
          <input placeholder={t("debt.remaining")} value={form.remainingAmount} onChange={e => setForm({...form, remainingAmount: formatNumberInput(e.target.value)})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
          <input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
          <textarea placeholder={t("debt.notes")} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" rows={2} />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium">{t("save")}</button>
            <button onClick={() => { resetForm(); setShowForm(false); }} className="px-4 py-2 text-sm text-zinc-500">{t("cancel")}</button>
          </div>
        </div>
      )}

      {active.map(d => (
        <div key={d.id} className="bg-white rounded-xl border border-zinc-100 p-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-medium text-sm">{d.name}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${d.type === "OWE" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>{d.type === "OWE" ? t("debt.owe") : t("debt.owed")}</span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">{formatIDR(d.remainingAmount)} / {formatIDR(d.amount)}{d.dueDate && ` · ${formatDate(d.dueDate)}`}</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => { setEditId(d.id); setForm({name: d.name, type: d.type, amount: formatNumberInput(String(d.amount)), remainingAmount: formatNumberInput(String(d.remainingAmount)), dueDate: d.dueDate?.split("T")[0] || "", notes: d.notes || ""}); setShowForm(true); }} className="text-zinc-300 hover:text-blue-500 p-1"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={() => markPaid(d.id)} className="text-green-500 hover:text-green-700 p-1" title={t("debt.mark_paid")}><CheckCircle className="w-3.5 h-3.5" /></button>
            <button onClick={() => remove(d.id)} className="text-zinc-300 hover:text-red-500 p-1"><X className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      ))}
      {active.length === 0 && !showForm && <p className="text-xs text-zinc-400 text-center py-4">{t("no_data")}</p>}
    </div>
  );
}

function RecurringSection({ pocketId, t }: { pocketId: number; t: (k: string) => string }) {
  const [items, setItems] = useState<Recurring[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: "", amount: "", type: "EXPENSE", frequency: "MONTHLY", dayOfMonth: "", notes: "" });

  const load = () => fetch(`/api/recurring-transactions?pocketId=${pocketId}`).then(r => r.json()).then(setItems);
  useEffect(() => { load(); }, [pocketId]);

  const submit = async () => {
    const amount = Math.round(parseFloat(form.amount.replace(/[^0-9]/g, "")));
    if (!amount || !form.description) return;
    await fetch("/api/recurring-transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      ...form, amount, dayOfMonth: form.dayOfMonth ? parseInt(form.dayOfMonth) : null, pocketId,
    })});
    setForm({ description: "", amount: "", type: "EXPENSE", frequency: "MONTHLY", dayOfMonth: "", notes: "" });
    setShowForm(false); load();
  };

  const toggleActive = async (item: Recurring) => {
    await fetch("/api/recurring-transactions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, isActive: !item.isActive }) });
    load();
  };

  const remove = async (id: number) => {
    await fetch(`/api/recurring-transactions?id=${id}`, { method: "DELETE" }); load();
  };

  const freqLabel: Record<string, string> = { DAILY: t("recurring.daily"), WEEKLY: t("recurring.weekly"), MONTHLY: t("recurring.monthly"), YEARLY: t("recurring.yearly") };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">{t("recurring.title")}</h2>
          <p className="text-xs text-zinc-400">{t("recurring.subtitle")}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-medium"><Plus className="w-3 h-3" /> {t("add")}</button>
      </div>

      {showForm && (
        <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-2">
          <div className="flex gap-2">
            <button onClick={() => setForm({...form, type: "EXPENSE"})} className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${form.type === "EXPENSE" ? "bg-red-100 text-red-700" : "bg-zinc-100"}`}>{t("expense")}</button>
            <button onClick={() => setForm({...form, type: "INCOME"})} className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${form.type === "INCOME" ? "bg-green-100 text-green-700" : "bg-zinc-100"}`}>{t("income")}</button>
          </div>
          <input placeholder={t("search")} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
          <input placeholder={t("total")} value={form.amount} onChange={e => setForm({...form, amount: formatNumberInput(e.target.value)})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
          <select value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm">
            <option value="DAILY">{t("recurring.daily")}</option>
            <option value="WEEKLY">{t("recurring.weekly")}</option>
            <option value="MONTHLY">{t("recurring.monthly")}</option>
            <option value="YEARLY">{t("recurring.yearly")}</option>
          </select>
          <input placeholder="Tanggal (1-31)" value={form.dayOfMonth} onChange={e => setForm({...form, dayOfMonth: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium">{t("save")}</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-zinc-500">{t("cancel")}</button>
          </div>
        </div>
      )}

      {items.map(item => (
        <div key={item.id} className="bg-white rounded-xl border border-zinc-100 p-3 flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${item.type === "INCOME" ? "bg-green-100" : "bg-red-100"}`}>
            {item.category?.icon || (item.type === "INCOME" ? "💰" : "💳")}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{item.description}</p>
            <p className="text-xs text-zinc-400">{freqLabel[item.frequency]}{item.dayOfMonth && ` tgl ${item.dayOfMonth}`}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className={`text-sm font-semibold ${item.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
              {item.type === "INCOME" ? "+" : "-"}{formatIDR(item.amount)}
            </span>
            <button onClick={() => toggleActive(item)} className={`p-1 ${item.isActive ? "text-green-500" : "text-zinc-300"}`}>
              <RefreshCw className={`w-3.5 h-3.5 ${!item.isActive && "opacity-30"}`} />
            </button>
            <button onClick={() => remove(item.id)} className="text-zinc-300 hover:text-red-500 p-1"><X className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      ))}
      {items.length === 0 && !showForm && <p className="text-xs text-zinc-400 text-center py-4">{t("no_data")}</p>}
    </div>
  );
}

function AccountSection({ t }: { t: (k: string) => string }) {
  const { pockets, activePocket, setActivePocket, refresh } = usePocket();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("👛");

  const createPocket = async () => {
    if (!newName.trim()) return;
    await fetch("/api/pockets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newName.trim(), emoji: newEmoji }) });
    setNewName(""); setShowCreate(false); refresh();
  };

  return (
    <div className="space-y-3">
      <h2 className="font-semibold">{t("account.title")}</h2>
      {pockets.map(p => (
        <button
          key={p.id}
          onClick={() => setActivePocket(p)}
          className={`w-full flex items-center gap-3 bg-white rounded-xl border p-3 text-left ${activePocket?.id === p.id ? "border-blue-300 bg-blue-50" : "border-zinc-100"}`}
        >
          <span className="text-lg">{p.emoji}</span>
          <div className="flex-1">
            <p className="text-sm font-medium">{p.name}</p>
            <p className="text-xs text-zinc-400">{formatIDR(p.balance)}</p>
          </div>
          {p.isDefault && <span className="text-[10px] text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">Default</span>}
        </button>
      ))}
      <button onClick={() => setShowCreate(true)} className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-zinc-300 rounded-xl text-sm text-zinc-500 hover:bg-zinc-50">
        <Plus className="w-4 h-4" /> {t("account.create")}
      </button>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold">{t("account.create")}</h3>
            <div className="flex gap-3">
              <input value={newEmoji} onChange={e => setNewEmoji(e.target.value)} className="w-14 text-center text-2xl border border-zinc-200 rounded-lg px-2 py-2" maxLength={2} />
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nama pocket" className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm" autoFocus />
            </div>
            <button onClick={createPocket} className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium">{t("save")}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsSection({ t, lang, setLang }: { t: (k: string) => string; lang: string; setLang: (l: "id" | "en") => void }) {
  return (
    <div className="space-y-3">
      <h2 className="font-semibold">{t("settings.title")}</h2>

      {/* Language */}
      <div className="bg-white rounded-xl border border-zinc-100 p-3 space-y-2">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Globe className="w-4 h-4" /> {t("settings.language")}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setLang("id")} className={`flex-1 py-2 rounded-lg text-sm font-medium ${lang === "id" ? "bg-blue-100 text-blue-700" : "bg-zinc-100 text-zinc-500"}`}>{t("settings.language.id")}</button>
          <button onClick={() => setLang("en")} className={`flex-1 py-2 rounded-lg text-sm font-medium ${lang === "en" ? "bg-blue-100 text-blue-700" : "bg-zinc-100 text-zinc-500"}`}>{t("settings.language.en")}</button>
        </div>
      </div>

      {/* About */}
      <div className="bg-white rounded-xl border border-zinc-100 p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500">{t("settings.about")}</span>
          <span className="text-zinc-700">Kawang Uang</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-zinc-500">{t("settings.version")}</span>
          <span className="text-zinc-700">1.0.0</span>
        </div>
      </div>

      {/* Note */}
      <p className="text-[10px] text-zinc-400 text-center">
        Dibuat dengan ❤️ oleh Kawang · Data aman di Supabase
      </p>
    </div>
  );
}

// === Main Page ===
export default function AccountPage() {
  const { activePocket } = usePocket();
  const { t, lang, setLang } = useTranslation();
  const [activeTab, setActiveTab] = useState<"debt" | "recurring" | "account" | "settings">("debt");

  const tabs = [
    { key: "debt" as const, icon: CreditCard, label: t("debt.title").split(" &")[0] },
    { key: "recurring" as const, icon: RefreshCw, label: "Berulang" },
    { key: "account" as const, icon: Wallet, label: t("account.title").split(" ")[0] },
    { key: "settings" as const, icon: Settings, label: t("settings.title") },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("nav.account")}</h1>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-zinc-100 rounded-xl p-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1 flex-1 py-1.5 text-[10px] font-medium rounded-lg justify-center transition-colors ${
              activeTab === tab.key ? "bg-white text-blue-600 shadow-sm" : "text-zinc-500"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "debt" && activePocket && <DebtSection pocketId={activePocket.id} t={t} />}
      {activeTab === "recurring" && activePocket && <RecurringSection pocketId={activePocket.id} t={t} />}
      {activeTab === "account" && activePocket && <AccountSection t={t} />}
      {activeTab === "settings" && <SettingsSection t={t} lang={lang} setLang={setLang} />}
    </div>
  );
}
