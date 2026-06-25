"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowRightLeft, PiggyBank, User, Plus } from "lucide-react";

const navItems = [
  { href: "/", label: "Beranda", icon: LayoutDashboard },
  { href: "/transactions", label: "Transaksi", icon: ArrowRightLeft },
  { href: "/budget", label: "Budget", icon: PiggyBank },
  { href: "/debts", label: "Akun", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      {/* FAB — only show on main pages */}
      {!pathname.startsWith("/import") && (
        <Link
          href="/transactions?add=1"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-600 active:scale-95 transition-all"
        >
          <Plus className="w-7 h-7 text-white" />
        </Link>
      )}

      {/* Bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-200 pb-5 safe-area-bottom">
        <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors ${
                  isActive
                    ? "text-blue-600"
                    : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
