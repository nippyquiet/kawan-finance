"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { ReactNode, useEffect, useState } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();
  const [mounted, setMounted] = useState(false);
  const isLogin = pathname === "/login";

  // Prevent hydration flicker
  useEffect(() => { setMounted(true); }, []);

  // Redirect unauthenticated users from protected pages
  useEffect(() => {
    if (mounted && status === "unauthenticated" && !isLogin) {
      router.replace("/login");
    }
  }, [mounted, status, isLogin, router]);

  // Login page — clean, no shell
  if (isLogin) {
    return <>{children}</>;
  }

  // Still checking auth — minimal loading
  if (!mounted || status === "loading") {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Not authenticated — should've been redirected, fallback
  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="pb-32">
      <TopBar />
      <main className="max-w-lg mx-auto px-4 py-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
