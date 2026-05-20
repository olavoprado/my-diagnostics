"use client";

import { Activity, AlertTriangle, FileText, LayoutDashboard, Settings, Users, LogOut, Code } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const res = await fetchWithAuth("/users/profile");
        if (res.ok) {
          const data = await res.json();
          setRole(data.user.role);
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    checkRole();
  }, [router]);

  const handleLogout = () => {
    // Limpa o cookie do token
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    // Redireciona para o login
    router.push("/login");
  };

  const isColaborador = role === "COLABORADOR";

  if (loading) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex selection:bg-indigo-500/30">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-slate-900/50 flex flex-col">
        <div className="h-16 border-b border-white/10 flex items-center px-6 gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            NR
          </div>
          <span className="font-semibold text-lg tracking-tight">RiskPlatform</span>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">
            Principal
          </div>
          <NavItem href="/dashboard" icon={<LayoutDashboard className="w-5 h-5" />} label="Visão Geral" active />
          <NavItem href="/dashboard/diagnostics" icon={<Activity className="w-5 h-5" />} label="Diagnósticos" />
          
          {!isColaborador && (
            <>
              <NavItem href="/dashboard/risks" icon={<AlertTriangle className="w-5 h-5" />} label="Matriz de Riscos" />
              <NavItem href="/dashboard/action-plans" icon={<FileText className="w-5 h-5" />} label="Planos de Ação" />
              <NavItem href="/dashboard/reports" icon={<FileText className="w-5 h-5" />} label="Relatórios" />
              
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-8 mb-4 px-2">
                Administração
              </div>
              <NavItem href="/dashboard/templates" icon={<Code className="w-5 h-5" />} label="Construtor No-Code" />
              <NavItem href="/dashboard/users" icon={<Users className="w-5 h-5" />} label="Usuários" />
              <NavItem href="/dashboard/settings" icon={<Settings className="w-5 h-5" />} label="Configurações" />
            </>
          )}
        </div>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-white/10 bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-medium text-slate-200">Painel de Controle</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-sm font-medium text-indigo-400">
              JS
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group",
        active 
          ? "bg-indigo-500/10 text-indigo-400 font-medium" 
          : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
      )}
    >
      <div className={cn(
        "transition-colors",
        active ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
      )}>
        {icon}
      </div>
      <span className="text-sm">{label}</span>
    </Link>
  );
}
