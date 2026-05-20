"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Calendar, AlertCircle, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchWithAuth } from "@/lib/api";

export default function ActionPlansPage() {
  const [actions, setActions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadActions() {
      try {
        const response = await fetchWithAuth("/actions");
        if (response.ok) {
          const data = await response.json();
          setActions(data.actions || []);
        }
      } catch (error) {
        console.error("Erro ao buscar ações:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadActions();
  }, []);

  const pending = actions.filter(a => a.status === 'PENDING');
  const inProgress = actions.filter(a => a.status === 'IN_PROGRESS');
  const done = actions.filter(a => a.status === 'DONE');

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Planos de Ação (PDCA)</h1>
          <p className="text-slate-400 mt-1 text-sm">Acompanhe as medidas de mitigação propostas para os riscos da matriz.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all shadow-[0_0_15px_rgba(79,70,229,0.2)]">
          <Plus className="w-5 h-5" />
          Nova Ação
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
          <span>Carregando planos de ação...</span>
        </div>
      ) : actions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-slate-900/50 rounded-2xl border border-white/10">
          <span className="text-lg font-medium text-slate-300">Nenhum plano de ação registrado</span>
          <span className="text-sm">Vá para a Matriz de Riscos para criar planos para os riscos identificados.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* A Fazer */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                A Fazer
              </h3>
              <span className="text-xs bg-white/10 text-slate-400 px-2 py-1 rounded-full">{pending.length}</span>
            </div>
            {pending.map(action => (
              <ActionCard key={action.id} action={action} />
            ))}
          </div>

          {/* Em Andamento */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-semibold text-indigo-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                Em Andamento
              </h3>
              <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-full">{inProgress.length}</span>
            </div>
            {inProgress.map(action => (
              <ActionCard key={action.id} action={action} />
            ))}
          </div>

          {/* Concluído */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-semibold text-emerald-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                Concluídos
              </h3>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">{done.length}</span>
            </div>
            {done.map(action => (
              <ActionCard key={action.id} action={action} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionCard({ action }: any) {
  const isCritical = action.priority === 'CRITICAL';
  const isHigh = action.priority === 'HIGH';
  const isDone = action.status === 'DONE';

  return (
    <div className={cn(
      "bg-slate-900/80 backdrop-blur-sm border rounded-xl p-4 transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer group",
      isDone ? "border-emerald-500/20 opacity-70" : "border-white/10 hover:border-white/20",
      isCritical && !isDone && "border-l-4 border-l-red-500",
      isHigh && !isDone && "border-l-4 border-l-amber-500"
    )}>
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-semibold px-2 py-1 rounded bg-white/5 text-slate-300">
          Ref: {action.riskItem?.code || 'Geral'}
        </span>
        {isCritical && !isDone && (
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded">
            <AlertCircle className="w-3 h-3" /> Crítico
          </span>
        )}
      </div>
      
      <p className={cn(
        "text-sm font-medium mb-4 leading-relaxed",
        isDone ? "text-slate-400 line-through" : "text-slate-200"
      )}>
        {action.description}
      </p>

      <div className="flex items-center justify-between text-xs mt-auto pt-3 border-t border-white/5">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          {action.deadline ? new Date(action.deadline).toLocaleDateString('pt-BR') : 'Sem prazo'}
        </div>
        
        {isDone ? (
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1 rounded-md">
            <CheckCircle2 className="w-3.5 h-3.5" /> Concluído
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold text-indigo-300" title="Responsável">
              {action.responsibleUserId ? action.responsibleUserId.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
