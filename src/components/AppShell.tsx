"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { ReactNode, useEffect } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();
  const isLogin = pathname === "/login" || pathname.startsWith("/api/auth");

  // Login / auth pages — no shell, no redirect
  if (isLogin) return <>{children}</>;

  // Redirect from protected pages to login
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // Not authenticated yet — show nothing
  if (status !== "authenticated") return null;

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
