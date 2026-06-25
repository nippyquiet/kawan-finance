import { Wallet, TrendingUp, PiggyBank, Shield } from "lucide-react";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";

export default function LoginPage() {
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

        <GoogleLoginButton />

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
