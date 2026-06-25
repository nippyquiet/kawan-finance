"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { ReactNode, useEffect } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const isLogin = pathname === "/login";

  // Only redirect from protected pages — never from login or auth pages
  useEffect(() => {
    if (status === "unauthenticated" && !isLogin && !pathname.startsWith("/api")) {
      router.replace("/login");
    }
  }, [status, isLogin, pathname, router]);

  // Login page — clean, no chrome, no redirect logic
  if (isLogin) return <>{children}</>;

  // Show app shell immediately (no loading spinner to avoid flicker)
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
