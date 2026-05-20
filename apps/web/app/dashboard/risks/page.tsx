"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Filter, Search, ArrowDownUp, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchWithAuth } from "@/lib/api";

export default function RiskMatrixPage() {
  const [risks, setRisks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRisks() {
      try {
        const response = await fetchWithAuth("/risks");
        if (response.ok) {
          const data = await response.json();
          setRisks(data.risks || []);
        }
      } catch (error) {
        console.error("Erro ao buscar riscos:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadRisks();
  }, []);

  const criticalCount = risks.filter(r => r.riskScore >= 15).length;
  const highCount = risks.filter(r => r.riskScore >= 10 && r.riskScore < 15).length;
  const controlledCount = risks.filter(r => r.status === 'CONTROLLED' || r.status === 'MITIGATED').length;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Matriz de Riscos</h1>
          <p className="text-slate-400 mt-1 text-sm">Inventário centralizado de todos os riscos mapeados nos diagnósticos.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg border border-white/10 transition-colors text-sm font-medium">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4">
          <div className="text-sm text-slate-400 mb-1">Total Mapeado</div>
          <div className="text-2xl font-bold text-white">{isLoading ? "-" : risks.length}</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <div className="text-sm text-red-400 mb-1">Riscos Críticos (Score &ge; 15)</div>
          <div className="text-2xl font-bold text-red-400">{isLoading ? "-" : criticalCount}</div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <div className="text-sm text-amber-400 mb-1">Riscos Altos (Score 10-14)</div>
          <div className="text-2xl font-bold text-amber-400">{isLoading ? "-" : highCount}</div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
          <div className="text-sm text-emerald-400 mb-1">Riscos Controlados</div>
          <div className="text-2xl font-bold text-emerald-400">{isLoading ? "-" : controlledCount}</div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-xl min-h-[400px]">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900">
          <div className="relative w-96">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Buscar por código, descrição ou GHE..." 
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Info className="w-4 h-4" />
            <span>Score = Probabilidade &times; Severidade</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
            <span>Carregando matriz de riscos...</span>
          </div>
        ) : risks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <AlertTriangle className="w-12 h-12 text-slate-600 mb-4" />
            <span className="text-lg font-medium text-slate-300">Nenhum risco mapeado</span>
            <span className="text-sm">Execute um diagnóstico primeiro para preencher a matriz.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-800/50 text-slate-400 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-medium">Código / Risco</th>
                  <th className="px-6 py-4 font-medium">Categoria</th>
                  <th className="px-6 py-4 font-medium">GHE</th>
                  <th className="px-6 py-4 font-medium text-center">Prob</th>
                  <th className="px-6 py-4 font-medium text-center">Sev</th>
                  <th className="px-6 py-4 font-medium text-center">Score</th>
                  <th className="px-6 py-4 font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {risks.map((risk) => {
                  const isCritical = risk.riskScore >= 15;
                  const isHigh = risk.riskScore >= 10 && risk.riskScore < 15;
                  
                  return (
                    <tr key={risk.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 max-w-xs">
                        <div className="font-medium text-white">{risk.riskItem.code}</div>
                        <div className="text-slate-400 text-xs mt-0.5 line-clamp-2" title={risk.riskItem.description}>
                          {risk.riskItem.description}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-white/5 text-xs">
                          {risk.riskItem.category.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{risk.exposureGroup?.name || "Geral"}</td>
                      <td className="px-6 py-4">
                        <div className="w-8 h-8 mx-auto rounded bg-slate-800 flex items-center justify-center font-medium border border-white/5">
                          {risk.probability}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-8 h-8 mx-auto rounded bg-slate-800 flex items-center justify-center font-medium border border-white/5">
                          {risk.severity}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn(
                          "w-10 h-10 mx-auto rounded-lg flex items-center justify-center font-bold text-base shadow-sm",
                          isCritical ? "bg-red-500 text-white shadow-red-500/20" :
                          isHigh ? "bg-amber-500 text-white shadow-amber-500/20" :
                          "bg-emerald-500 text-white shadow-emerald-500/20"
                        )}>
                          {risk.riskScore}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isCritical ? (
                          <button className="text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors">
                            Criar Plano
                          </button>
                        ) : (
                          <button className="text-xs font-medium text-indigo-400 hover:text-indigo-300">
                            Detalhes
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
