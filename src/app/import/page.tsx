"use client";

import { useState, useRef } from "react";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";

export default function ImportPage() {
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setResult(null);

    const text = await file.text();
    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: text,
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Import Data</h1>

      <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <h2 className="font-semibold">Import dari MoneyLover</h2>
        <p className="text-sm text-zinc-500">
          Export CSV dari MoneyLover: Buka app → Settings → Export Data → Export to CSV.
          Upload file CSV di sini.
        </p>

        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-zinc-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
        >
          <Upload className="w-8 h-8 mx-auto text-zinc-400 mb-2" />
          <p className="text-sm text-zinc-500">Klik untuk upload file CSV</p>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
        </div>

        {loading && <p className="text-sm text-blue-600 text-center">Memproses...</p>}

        {result && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{result.imported} transaksi berhasil diimport</span>
            </div>
            {result.errors.length > 0 && (
              <div className="space-y-1 mt-2">
                <p className="text-xs text-red-500 font-medium">{result.errors.length} error:</p>
                {result.errors.slice(0, 5).map((err, i) => (
                  <p key={i} className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {err}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <h3 className="font-semibold text-sm mb-2">Format CSV yang didukung:</h3>
        <pre className="text-xs text-zinc-500 bg-zinc-50 p-3 rounded-lg overflow-x-auto">
{`date,amount,type,category,description
2026-01-15,50000,EXPENSE,Makan,GoFood siang
2026-01-15,5000000,INCOME,Gaji,Gaji Januari`}
        </pre>
        <p className="text-xs text-zinc-400 mt-2">
          amount dalam Rupiah (tanpa titik/koma).<br />
          type: EXPENSE atau INCOME.<br />
          category: harus sesuai nama kategori yang ada.
        </p>
      </div>
    </div>
  );
}
