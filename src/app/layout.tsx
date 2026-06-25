import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { I18nProvider } from "@/lib/i18n";
import { PocketProvider } from "@/lib/PocketContext";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { AuthProvider } from "@/components/AuthProvider";
import { prisma } from "@/lib/prisma";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KAWAN UANG",
  description: "Aplikasi Keuangan Pribadi",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch pockets on server — no client-side waterfall
  let initialPockets: any[] = [];
  try {
    initialPockets = await prisma.pocket.findMany({ orderBy: { createdAt: "asc" } });
  } catch {
    // Silent fail — client will fetch on mount
  }

  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-zinc-50 pb-32">
        <AuthProvider>
          <I18nProvider>
            <PocketProvider initialPockets={initialPockets}>
              <TopBar />
              <main className="max-w-lg mx-auto px-4 py-4">
                <Suspense fallback={<div className="text-center py-8 text-sm text-zinc-400">Memuat...</div>}>
                  {children}
                </Suspense>
              </main>
              <BottomNav />
            </PocketProvider>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
