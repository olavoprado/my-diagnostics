"use client";

import { useEffect, useState } from "react";
import { Activity, Calendar, MapPin, CheckCircle2, Clock, Plus, ArrowRight, Search, Filter, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function DiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [diagRes, profileRes] = await Promise.all([
          fetchWithAuth("/diagnostics"),
          fetchWithAuth("/users/profile")
        ]);

        if (diagRes.ok) {
          const data = await diagRes.json();
          setDiagnostics(data.diagnostics || []);
        }
        
        if (profileRes.ok) {
          const data = await profileRes.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este diagnóstico? Todos os dados vinculados serão perdidos.")) return;
    
    try {
      const res = await fetchWithAuth(`/diagnostics/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDiagnostics(prev => prev.filter(d => d.id !== id));
      } else {
        alert("Erro ao excluir diagnóstico.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const isColaborador = user?.role === 'COLABORADOR';

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Diagnósticos</h1>
          <p className="text-slate-400 mt-1 text-sm">
            {isColaborador 
              ? "Visualize seus questionários pendentes e finalizados." 
              : "Gerencie todos os levantamentos de riscos da sua empresa."}
          </p>
        </div>
        
        {!isColaborador && (
          <Link 
            href="/dashboard/diagnostics/new"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-[0_0_15px_rgba(79,70,229,0.2)]"
          >
            <Plus className="w-5 h-5" />
            Novo Diagnóstico
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {diagnostics.length === 0 ? (
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-12 text-center">
            <Activity className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-300">Nenhum diagnóstico encontrado</h3>
            <p className="text-slate-500 mt-2">Clique em "Novo Diagnóstico" para iniciar um levantamento.</p>
          </div>
        ) : (
          diagnostics.map((diag) => (
            <div 
              key={diag.id}
              className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 hover:bg-slate-800/50 transition-all group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Activity className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                        {diag.module?.name}
                      </h3>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                        diag.status === 'COMPLETED' 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      )}>
                        {diag.status === 'COMPLETED' ? "Concluído" : "Em Andamento"}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-slate-400">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-500" />
                        {diag.workplace?.name || "Sede Principal"}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        Iniciado em {new Date(diag.startedAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        {diag.status === 'COMPLETED' ? "Finalizado" : "Pendente"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {!isColaborador && (
                    <button 
                      onClick={() => handleDelete(diag.id)}
                      className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all mr-2"
                      title="Excluir diagnóstico"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  <Link 
                    href={`/dashboard/diagnostics/${diag.id}/results`}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-2.5 rounded-xl font-medium transition-all"
                  >
                    Ver Detalhes
                  </Link>
                  <Link 
                    href={`/dashboard/diagnostics/${diag.id}/results`} 
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/10"
                  >
                    {diag.status === 'COMPLETED' ? "Revisar" : "Continuar"}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
