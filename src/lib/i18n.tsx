"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

export type Lang = "id" | "en";

type Dict = {
  [key: string]: string;
};

const dictionaries: Record<Lang, Dict> = {
  id: {
    "app.name": "KAWAN Finance",
    "nav.home": "Beranda",
    "nav.transactions": "Transaksi",
    "nav.budget": "Budget",
    "nav.account": "Akun",
    "balance": "Saldo",
    "income": "Pemasukan",
    "expense": "Pengeluaran",
    "net": "Bersih",
    "add": "Tambah",
    "edit": "Edit",
    "delete": "Hapus",
    "save": "Simpan",
    "cancel": "Batal",
    "search": "Cari",
    "all": "Semua",
    "this_month": "Bulan Ini",
    "last_month": "Bulan Lalu",
    "future": "Mendatang",
    "no_data": "Belum ada data",
    "loading": "Memuat...",
    "total": "Total",
    "debt.title": "Hutang & Piutang",
    "debt.owe": "Gua Hutang",
    "debt.owed": "Dihutangi",
    "recurring.title": "Transaksi Berulang",
    "recurring.subtitle": "Langganan, cicilan, dan pemasukan rutin",
    "recurring.monthly": "Bulanan",
    "recurring.weekly": "Mingguan",
    "recurring.yearly": "Tahunan",
    "recurring.daily": "Harian",
    "recurring.active": "Aktif",
    "recurring.inactive": "Nonaktif",
    "account.title": "Akun Saya",
    "account.switch": "Ganti Akun",
    "account.create": "Buat Akun Baru",
    "settings.title": "Pengaturan",
    "settings.language": "Bahasa",
    "settings.language.id": "Indonesia",
    "settings.language.en": "English",
    "settings.about": "Tentang",
    "settings.version": "Versi",
    "debt.you_owe": "Hutang (gua)",
    "debt.you_owed": "Piutang (orang)",
    "debt.net": "Net",
    "debt.person_name": "Nama orang",
    "debt.total_amount": "Total nominal",
    "debt.remaining": "Sisa",
    "debt.due_date": "Jatuh tempo",
    "debt.notes": "Catatan",
    "debt.mark_paid": "Lunas",
  },
  en: {
    "app.name": "KAWAN Finance",
    "nav.home": "Home",
    "nav.transactions": "Transactions",
    "nav.budget": "Budget",
    "nav.account": "Account",
    "balance": "Balance",
    "income": "Income",
    "expense": "Expense",
    "net": "Net",
    "add": "Add",
    "edit": "Edit",
    "delete": "Delete",
    "save": "Save",
    "cancel": "Cancel",
    "search": "Search",
    "all": "All",
    "this_month": "This Month",
    "last_month": "Last Month",
    "future": "Future",
    "no_data": "No data yet",
    "loading": "Loading...",
    "total": "Total",
    "debt.title": "Debts & Receivables",
    "debt.owe": "I Owe",
    "debt.owed": "Owed to Me",
    "recurring.title": "Recurring Transactions",
    "recurring.subtitle": "Subscriptions, installments, and recurring income",
    "recurring.monthly": "Monthly",
    "recurring.weekly": "Weekly",
    "recurring.yearly": "Yearly",
    "recurring.daily": "Daily",
    "recurring.active": "Active",
    "recurring.inactive": "Inactive",
    "account.title": "My Account",
    "account.switch": "Switch Account",
    "account.create": "Create New Account",
    "settings.title": "Settings",
    "settings.language": "Language",
    "settings.language.id": "Indonesia",
    "settings.language.en": "English",
    "settings.about": "About",
    "settings.version": "Version",
    "debt.you_owe": "You Owe",
    "debt.you_owed": "Owed to You",
    "debt.net": "Net",
    "debt.person_name": "Person name",
    "debt.total_amount": "Total amount",
    "debt.remaining": "Remaining",
    "debt.due_date": "Due date",
    "debt.notes": "Notes",
    "debt.mark_paid": "Mark Paid",
  },
};

type I18nContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextType>({
  lang: "id",
  setLang: () => {},
  t: (k) => k,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("id");

  useEffect(() => {
    const saved = localStorage.getItem("kawan-lang") as Lang;
    if (saved && (saved === "id" || saved === "en")) setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("kawan-lang", l);
  }, []);

  const t = useCallback((key: string): string => {
    return dictionaries[lang]?.[key] || dictionaries["id"]?.[key] || key;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
