import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { I18nProvider } from "@/lib/i18n";
import { PocketProvider } from "@/lib/PocketContext";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KAWAN Finance",
  description: "Personal Finance Manager",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-zinc-50 pb-32">
        <I18nProvider>
          <PocketProvider>
            <TopBar />
            <main className="max-w-lg mx-auto px-4 py-4">
              <Suspense fallback={<div className="text-center py-8 text-sm text-zinc-400">Memuat...</div>}>
                {children}
              </Suspense>
            </main>
            <BottomNav />
          </PocketProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
