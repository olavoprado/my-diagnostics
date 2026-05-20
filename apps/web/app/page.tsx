import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <div className={cn("min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500/30", inter.className)}>
      {/* Navbar */}
      <nav className="border-b border-white/10 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                NR
              </div>
              <span className="font-semibold text-lg tracking-tight">RiskPlatform</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                Módulos
              </button>
              <button className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                Relatórios
              </button>
              <div className="w-px h-4 bg-white/10 mx-2"></div>
              <button className="text-sm font-medium bg-white text-slate-900 px-4 py-2 rounded-full hover:bg-slate-200 transition-all hover:scale-105 active:scale-95 shadow-sm">
                Entrar
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-8 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-medium border border-indigo-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Novo módulo NR-1 disponível
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Diagnóstico inteligente para segurança no trabalho.
          </h1>
          
          <p className="text-lg text-slate-400 leading-relaxed">
            Automatize seus inventários, gerencie riscos e gere o PGR com uma plataforma modular e totalmente adaptável a qualquer norma (NR-1, NR-5, NR-9, ESG).
          </p>
          
          <div className="flex items-center justify-center gap-4 pt-4">
            <button className="px-8 py-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all hover:shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:-translate-y-0.5">
              Iniciar Diagnóstico
            </button>
            <button className="px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 text-white font-medium border border-white/10 transition-all">
              Agendar Demo
            </button>
          </div>
        </div>

        {/* Mock Dashboard Preview */}
        <div className="mt-20 relative mx-auto max-w-5xl">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10"></div>
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20"></div>
          <div className="relative rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl overflow-hidden shadow-2xl">
            <div className="h-12 border-b border-white/10 flex items-center px-4 gap-2 bg-slate-900/80">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <div className="p-8 grid grid-cols-3 gap-6">
              {/* Cards */}
              <div className="col-span-2 space-y-6">
                <div className="h-40 rounded-xl border border-white/5 bg-white/5 p-6 space-y-4">
                  <div className="h-4 w-1/3 bg-white/10 rounded-full"></div>
                  <div className="h-12 w-full bg-gradient-to-r from-indigo-500/20 to-transparent rounded-lg border border-indigo-500/20"></div>
                  <div className="h-12 w-3/4 bg-white/5 rounded-lg"></div>
                </div>
                <div className="h-64 rounded-xl border border-white/5 bg-white/5 p-6">
                  <div className="h-4 w-1/4 bg-white/10 rounded-full mb-6"></div>
                  <div className="flex items-end gap-4 h-40">
                    <div className="w-full bg-indigo-500/40 rounded-t-sm h-[40%]"></div>
                    <div className="w-full bg-indigo-500/60 rounded-t-sm h-[70%]"></div>
                    <div className="w-full bg-indigo-500/80 rounded-t-sm h-[90%]"></div>
                    <div className="w-full bg-indigo-500 rounded-t-sm h-[100%]"></div>
                    <div className="w-full bg-indigo-500/50 rounded-t-sm h-[60%]"></div>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="h-full rounded-xl border border-white/5 bg-white/5 p-6 space-y-4">
                  <div className="h-4 w-1/2 bg-white/10 rounded-full mb-8"></div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/30"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-3 w-full bg-white/10 rounded-full"></div>
                      <div className="h-3 w-2/3 bg-white/5 rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-3 w-full bg-white/10 rounded-full"></div>
                      <div className="h-3 w-2/3 bg-white/5 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
