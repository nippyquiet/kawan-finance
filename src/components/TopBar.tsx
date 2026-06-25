"use client";

import { usePocket } from "@/lib/PocketContext";
import { formatIDR } from "@/lib/utils";
import Link from "next/link";
import { ChevronDown, Search, Plus, X } from "lucide-react";
import { useState } from "react";

export function TopBar() {
  const { pockets, activePocket, setActivePocket, refresh } = usePocket();
  const [showPicker, setShowPicker] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("👛");

  const createPocket = async () => {
    if (!newName.trim()) return;
    await fetch("/api/pockets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), emoji: newEmoji }),
    });
    setNewName("");
    setShowCreate(false);
    refresh();
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-zinc-200 px-4 pt-3 pb-2">
      {/* Top row: brand + icons */}
      <div className="flex items-center justify-between mb-2">
        <Link href="/" className="font-bold text-lg text-blue-600 tracking-tight">
          Kawang
        </Link>
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-zinc-500" />
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">
            A
          </div>
        </div>
      </div>

      {/* Pocket selector */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="flex items-center gap-2 w-full"
        >
          <span className="text-lg">{activePocket?.emoji || "👛"}</span>
          <span className="font-semibold text-base">{activePocket?.name || "Loading..."}</span>
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        </button>

        {showPicker && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg z-50 py-1">
            {pockets.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setActivePocket(p);
                  setShowPicker(false);
                }}
                className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-zinc-50 ${
                  activePocket?.id === p.id ? "bg-blue-50 text-blue-700" : ""
                }`}
              >
                <span className="text-lg">{p.emoji}</span>
                <div className="flex-1 text-left">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-zinc-400">{formatIDR(p.balance)}</p>
                </div>
                {p.isDefault && <span className="text-xs text-zinc-400">Default</span>}
              </button>
            ))}
            <hr className="my-1 border-zinc-100" />
            <button
              onClick={() => { setShowPicker(false); setShowCreate(true); }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50"
            >
              <Plus className="w-4 h-4" /> Pocket Baru
            </button>
          </div>
        )}
      </div>

      {/* Balance */}
      <p className="text-3xl font-bold mt-1">
        {activePocket ? formatIDR(activePocket.balance) : "Rp 0"}
      </p>

      {/* Create pocket modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] bg-black/30 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Pocket Baru</h3>
              <button onClick={() => setShowCreate(false)}><X className="w-4 h-4 text-zinc-400" /></button>
            </div>
            <div className="flex gap-3">
              <input
                value={newEmoji}
                onChange={e => setNewEmoji(e.target.value)}
                className="w-14 text-center text-2xl border border-zinc-200 rounded-lg px-2 py-2"
                maxLength={2}
              />
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Nama pocket"
                className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                autoFocus
              />
            </div>
            <button
              onClick={createPocket}
              className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700"
            >
              Buat Pocket
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
