import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { I18nProvider } from "@/lib/i18n";
import { PocketProvider } from "@/lib/PocketContext";
import { AuthProvider } from "@/components/AuthProvider";
import { AppShell } from "@/components/AppShell";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-zinc-50">
        <AuthProvider>
          <I18nProvider>
            <PocketProvider>
              <AppShell>
                <Suspense fallback={<div className="text-center py-8 text-sm text-zinc-400">Memuat...</div>}>
                  {children}
                </Suspense>
              </AppShell>
            </PocketProvider>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
