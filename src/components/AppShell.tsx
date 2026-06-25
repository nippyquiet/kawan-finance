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
  const isLogin = pathname === "/login";
  const isAuthPage = pathname.startsWith("/api/auth");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated" && !isLogin && !isAuthPage) {
      router.replace("/login");
    }
  }, [status, isLogin, isAuthPage, router]);

  // Show nothing while checking auth
  if (status === "loading" && !isLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isLogin) {
    return <>{children}</>;
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
