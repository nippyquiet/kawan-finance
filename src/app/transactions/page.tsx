"use client";

import { useEffect, useState, useRef } from "react";
import { usePocket } from "@/lib/PocketContext";
import { formatIDR, formatDate, getTodayStr, formatNumberInput } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { Trash2, Plus, X, Sparkles, FolderPlus, Pencil, Paperclip, FileText, Image as ImageIcon, Eye, Search, Filter } from "lucide-react";

type Category = { id: number; name: string; type: string; icon: string; color: string };
type Transaction = {
  id: number; amount: number; description: string; date: string;
  type: string; categoryId?: number | null; category?: Category | null;
  attachmentPath?: string | null; attachmentType?: string | null;
};

const emptyForm = { amount: "", description: "", date: getTodayStr(), type: "EXPENSE", categoryId: "", attachmentPath: "", attachmentType: "" };
const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

type FilterPeriod = "all" | "thisMonth" | "lastMonth" | "future";

export default function TransactionsPage() {
  const { activePocket } = usePocket();
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);

  // Filters
  const [period, setPeriod] = useState<FilterPeriod>("thisMonth");
  const [typeFilter, setTypeFilter] = useState<"all" | "INCOME" | "EXPENSE">("all");
  const [searchQ, setSearchQ] = useState("");

  const [suggestion, setSuggestion] = useState<{ label: string; confidence: number } | null>(null);
  const [newCatSuggestion, setNewCatSuggestion] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [showNewCatForm, setShowNewCatForm] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ path: string; type: string; originalName: string } | null>(null);
  const [previewTx, setPreviewTx] = useState<Transaction | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const getDateFilter = () => {
    const now = new Date();
    const m = now.getMonth() + 1;
    const y = now.getFullYear();
    switch (period) {
      case "thisMonth":
        return { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
      case "lastMonth":
        return { gte: new Date(y, m - 2, 1), lt: new Date(y, m - 1, 1) };
      case "future":
        return { gte: new Date(y, m, 1) };
      case "all":
      default:
        return {};
    }
  };

  const load = () => {
    if (!activePocket) return;
    setLoading(true);
    const dateFilter = getDateFilter();
    let url = `/api/transactions?pocketId=${activePocket.id}`;
    if (dateFilter.gte) url += `&dateFrom=${dateFilter.gte.toISOString()}`;
    if (dateFilter.lt) url += `&dateTo=${dateFilter.lt.toISOString()}`;

    Promise.all([
      fetch(url).then(r => r.json()),
      fetch("/api/categories").then(r => r.json()),
    ]).then(([txData, cats]) => {
      setTransactions(txData.transactions || []);
      setCategories(cats);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [activePocket, period]);

  // Open form from FAB
  useEffect(() => {
    if (searchParams.get("add") === "1") {
      setShowForm(true);
    }
  }, [searchParams]);

  // Filter + search
  const filtered = transactions
    .filter(t => typeFilter === "all" || t.type === typeFilter)
    .filter(t => !searchQ || t.description.toLowerCase().includes(searchQ.toLowerCase()));

  // Summary
  const totalIncome = filtered.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);

  // Group by date
  const grouped: Record<string, Transaction[]> = {};
  for (const t of filtered) {
    const key = t.date.split("T")[0];
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  }

  const suggestCategory = (desc: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (desc.trim().length < 2) { setSuggestion(null); setNewCatSuggestion(null); return; }
    debounceRef.current = setTimeout(async () => {
      setSuggesting(true);
      try {
        const res = await fetch(`/api/suggest-category?q=${encodeURIComponent(desc)}`);
        const data = await res.json();
        if (data.categoryId && data.confidence >= 0.4) {
          setForm(prev => ({ ...prev, categoryId: String(data.categoryId) }));
          setSuggestion({ label: `${data.category?.icon || "📌"} ${data.category?.name || ""}`, confidence: data.confidence });
          setNewCatSuggestion(null);
        } else if (data.suggestedNewCategory) { setSuggestion(null); setNewCatSuggestion(data.suggestedNewCategory); }
        else { setSuggestion(null); setNewCatSuggestion(null); }
      } catch { setSuggestion(null); setNewCatSuggestion(null); }
      setSuggesting(false);
    }, 400);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.path) {
        setUploadedFile({ path: data.path, type: data.type, originalName: data.originalName });
        setForm(prev => ({ ...prev, attachmentPath: data.path, attachmentType: data.type }));
      }
    } catch {}
    setUploading(false);
  };

  const createCategory = async (name: string) => {
    const res = await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, type: form.type }) });
    return res.json();
  };

  const handleCreateCategory = async (name: string) => {
    const cat = await createCategory(name);
    setCategories(await fetch("/api/categories").then(r => r.json()));
    setForm(prev => ({ ...prev, categoryId: String(cat.id) }));
    setShowNewCatForm(false); setNewCatName(""); setNewCatSuggestion(null);
  };

  const openEdit = (tx: Transaction) => {
    setEditId(tx.id);
    setForm({
      amount: formatNumberInput(String(tx.amount)),
      description: tx.description,
      date: tx.date.split("T")[0],
      type: tx.type,
      categoryId: tx.categoryId ? String(tx.categoryId) : "",
      attachmentPath: tx.attachmentPath || "",
      attachmentType: tx.attachmentType || "",
    });
    if (tx.attachmentPath) setUploadedFile({ path: tx.attachmentPath, type: tx.attachmentType || "", originalName: "" });
    else setUploadedFile(null);
    setShowForm(true);
  };

  const resetForm = () => {
    setForm(emptyForm); setEditId(null); setSuggestion(null); setNewCatSuggestion(null);
    setUploadedFile(null); setShowNewCatForm(false);
  };

  const submit = async () => {
    const amount = Math.round(parseFloat(form.amount.replace(/[^0-9]/g, "")));
    if (!amount || !form.description) return;
    const payload = {
      amount, description: form.description, date: form.date, type: form.type,
      categoryId: form.categoryId ? parseInt(form.categoryId) : null,
      attachmentPath: form.attachmentPath || null,
      attachmentType: form.attachmentType || null,
      pocketId: activePocket?.id || null,
    };
    if (editId) {
      await fetch(`/api/transactions/${editId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } else {
      await fetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    resetForm(); setShowForm(false); load();
  };

  const remove = async (id: number) => {
    await fetch(`/api/transactions/${id}`, { method: "DELETE" }); load();
  };

  const expenseCats = categories.filter(c => c.type === "EXPENSE");
  const incomeCats = categories.filter(c => c.type === "INCOME");

  return (
    <div className="space-y-4">
      {/* Header + Search */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Transaksi</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-blue-700">
          <Plus className="w-3.5 h-3.5" /> Baru
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          placeholder="Cari transaksi..."
          className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-xl text-sm bg-white"
        />
      </div>

      {/* Period Tabs */}
      <div className="flex gap-1 bg-zinc-100 rounded-xl p-1">
        {[
          { key: "all" as FilterPeriod, label: "Semua" },
          { key: "thisMonth" as FilterPeriod, label: "Bulan Ini" },
          { key: "lastMonth" as FilterPeriod, label: "Bulan Lalu" },
          { key: "future" as FilterPeriod, label: "Mendatang" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setPeriod(tab.key)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              period === tab.key ? "bg-white text-blue-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Type Filter */}
      <div className="flex gap-2">
        {[
          { key: "all" as "all", label: "Semua" },
          { key: "INCOME" as "INCOME", label: "Pemasukan" },
          { key: "EXPENSE" as "EXPENSE", label: "Pengeluaran" },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setTypeFilter(f.key)}
            className={`px-3 py-1 text-xs rounded-lg font-medium ${
              typeFilter === f.key
                ? f.key === "INCOME" ? "bg-green-100 text-green-700" : f.key === "EXPENSE" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                : "bg-zinc-100 text-zinc-500"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Summary bar */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between bg-white rounded-xl border border-zinc-100 px-4 py-2.5 text-sm">
          <span className="text-zinc-500">{filtered.length} transaksi</span>
          <div className="flex gap-3">
            <span className="text-green-600 font-medium">+{formatIDR(totalIncome)}</span>
            <span className="text-red-600 font-medium">-{formatIDR(totalExpense)}</span>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-zinc-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{editId ? "Edit Transaksi" : "Transaksi Baru"}</h2>
            <button onClick={() => { resetForm(); setShowForm(false); }}><X className="w-4 h-4 text-zinc-400" /></button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setForm({...form, type: "EXPENSE"})} className={`flex-1 py-2 rounded-lg text-sm font-medium ${form.type === "EXPENSE" ? "bg-red-100 text-red-700" : "bg-zinc-100 text-zinc-600"}`}>Pengeluaran</button>
            <button onClick={() => setForm({...form, type: "INCOME"})} className={`flex-1 py-2 rounded-lg text-sm font-medium ${form.type === "INCOME" ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-600"}`}>Pemasukan</button>
          </div>
          <input placeholder="Jumlah (Rp)" value={form.amount} onChange={e => setForm({...form, amount: formatNumberInput(e.target.value)})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />

          <div className="relative">
            <input placeholder="Deskripsi" value={form.description} onChange={e => { setForm({...form, description: e.target.value}); suggestCategory(e.target.value); }} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm pr-8" />
            {suggesting && <div className="absolute right-2 top-1/2 -translate-y-1/2"><div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" /></div>}
          </div>

          {suggestion && (
            <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg">
              <Sparkles className="w-3 h-3" /> Auto: {suggestion.label} <span className="text-blue-400 ml-1">({Math.round(suggestion.confidence * 100)}%)</span>
            </div>
          )}
          {newCatSuggestion && (
            <button onClick={() => { setNewCatName(newCatSuggestion); setShowNewCatForm(true); }} className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg w-full text-left hover:bg-emerald-100">
              <FolderPlus className="w-3.5 h-3.5" /> Buat kategori baru: <strong>{newCatSuggestion}</strong>
            </button>
          )}
          {showNewCatForm && (
            <div className="bg-zinc-50 rounded-xl p-3 space-y-2 border border-zinc-200">
              <p className="text-xs font-medium text-zinc-600">Kategori Baru</p>
              <div className="flex gap-2">
                <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Nama kategori" className="flex-1 px-3 py-1.5 border border-zinc-200 rounded-lg text-sm" autoFocus />
                <button onClick={() => handleCreateCategory(newCatName)} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-emerald-700">Buat</button>
                <button onClick={() => { setShowNewCatForm(false); setNewCatName(""); }} className="text-zinc-400 hover:text-zinc-600 px-2"><X className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />

          <select value={form.categoryId} onChange={e => {
            if (e.target.value === "__NEW__") { setShowNewCatForm(true); setNewCatName(form.description.split(" ").slice(0, 2).join(" ") || ""); }
            else setForm({...form, categoryId: e.target.value});
          }} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm">
            <option value="">Pilih kategori</option>
            {(form.type === "EXPENSE" ? expenseCats : incomeCats).map(c => (<option key={c.id} value={c.id}>{c.icon} {c.name}</option>))}
            <option value="__NEW__" className="text-emerald-600 font-medium">+ Buat kategori baru...</option>
          </select>

          <div className="border border-dashed border-zinc-300 rounded-xl p-3">
            <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleUpload} className="hidden" />
            {uploadedFile ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  {uploadedFile.type === "IMAGE" ? <ImageIcon className="w-4 h-4 text-blue-500" /> : <FileText className="w-4 h-4 text-orange-500" />}
                  <span className="truncate max-w-[200px]">{uploadedFile.path.split("/").pop()}</span>
                </div>
                <button onClick={() => { setUploadedFile(null); setForm(prev => ({ ...prev, attachmentPath: "", attachmentType: "" })); }} className="text-xs text-red-500 hover:underline">Hapus</button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-blue-600 w-full justify-center py-1" disabled={uploading}>
                <Paperclip className="w-4 h-4" /> {uploading ? "Mengupload..." : "Lampirkan invoice"}
              </button>
            )}
          </div>

          <button onClick={submit} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            {editId ? "Simpan Perubahan" : "Simpan"}
          </button>
        </div>
      )}

      {/* Preview Modal */}
      {previewTx && previewTx.attachmentPath && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setPreviewTx(null)}>
          <div className="bg-white rounded-xl max-w-lg max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-zinc-100">
              <p className="text-sm font-medium">{previewTx.description}</p>
              <button onClick={() => setPreviewTx(null)}><X className="w-4 h-4" /></button>
            </div>
            {previewTx.attachmentType === "IMAGE" ? (
              <img src={previewTx.attachmentPath} alt="" className="w-full" />
            ) : (
              <iframe src={previewTx.attachmentPath} className="w-full h-[60vh]" />
            )}
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-zinc-400 text-sm py-8">Memuat...</p>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-zinc-100">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-zinc-400 text-sm">Belum ada transaksi</p>
          </div>
        ) : (
          Object.entries(grouped).map(([dateKey, txs]) => {
            const d = new Date(dateKey + "T00:00:00");
            const isToday = dateKey === new Date().toISOString().split("T")[0];
            const isYesterday = dateKey === new Date(Date.now() - 86400000).toISOString().split("T")[0];
            const isFuture = d > new Date();
            let label = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
            if (isToday) label = "Hari Ini";
            else if (isYesterday) label = "Kemarin";
            else if (isFuture) label = `${d.getDate()} ${MONTHS[d.getMonth()]}`;

            const dayTotal = txs.reduce((s, t) => s + (t.type === "INCOME" ? t.amount : -t.amount), 0);

            return (
              <div key={dateKey}>
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <h3 className="text-xs font-medium text-zinc-500">{label}</h3>
                  <span className={`text-xs font-semibold ${dayTotal >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {dayTotal >= 0 ? "+" : ""}{formatIDR(dayTotal)}
                  </span>
                </div>
                <div className="bg-white rounded-xl border border-zinc-100 divide-y divide-zinc-50">
                  {txs.map(tx => (
                    <div key={tx.id} className="flex items-center gap-3 px-3 py-3 hover:bg-zinc-50">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                        tx.type === "INCOME" ? "bg-green-100" : "bg-blue-100"
                      }`}>
                        {tx.category?.icon || (tx.type === "INCOME" ? "💰" : "💳")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{tx.description || "Tanpa keterangan"}</p>
                        <p className="text-xs text-zinc-400 flex items-center gap-1">
                          {tx.category?.name || "Lainnya"}
                          {tx.attachmentPath && <Eye className="w-3 h-3 inline" />}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <p className={`text-sm font-semibold ${tx.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                          {tx.type === "INCOME" ? "+" : "-"}{formatIDR(tx.amount)}
                        </p>
                        <button onClick={() => openEdit(tx)} className="text-zinc-300 hover:text-blue-500 p-1"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => remove(tx.id)} className="text-zinc-300 hover:text-red-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
