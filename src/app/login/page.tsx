import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Wallet, TrendingUp, PiggyBank, Shield } from "lucide-react";
import Link from "next/link";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/");

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200">
          <span className="text-4xl">💰</span>
        </div>
        <h1 className="text-3xl font-extrabold text-zinc-800 tracking-tight">KAWAN UANG</h1>
        <p className="text-zinc-500 mt-2 max-w-xs">
          Partner finansialmu. Lacak, atur, dan kendalikan keuangan dengan mudah.
        </p>

        <div className="grid grid-cols-2 gap-3 mt-8 max-w-sm w-full">
          {[
            { icon: Wallet, text: "Multi Pocket", color: "text-blue-600 bg-blue-100" },
            { icon: TrendingUp, text: "Analitik Bulanan", color: "text-emerald-600 bg-emerald-100" },
            { icon: PiggyBank, text: "Budget & Target", color: "text-orange-600 bg-orange-100" },
            { icon: Shield, text: "Data Aman", color: "text-purple-600 bg-purple-100" },
          ].map((f, i) => (
            <div key={i} className="bg-white rounded-xl border border-zinc-100 p-3 flex flex-col items-center gap-1.5">
              <div className={`w-9 h-9 rounded-xl ${f.color} flex items-center justify-center`}>
                <f.icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-zinc-600">{f.text}</span>
            </div>
          ))}
        </div>

        {/* Direct Google OAuth link — no server action */}
        <Link
          href="/api/auth/signin/google"
          className="mt-8 w-full max-w-sm flex items-center justify-center gap-3 bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-800 px-6 py-3.5 rounded-2xl font-medium shadow-sm hover:shadow transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Lanjutkan dengan Google
        </Link>

        <p className="text-xs text-zinc-400 mt-6">
          Data kamu hanya bisa diakses olehmu &middot; Enkripsi end-to-end
        </p>
      </div>

      <p className="text-center text-xs text-zinc-300 pb-8">
        &copy; {new Date().getFullYear()} KAWAN UANG
      </p>
    </div>
  );
}
