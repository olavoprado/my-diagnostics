"use client";

import { useEffect, useState } from "react";
import { Activity, AlertOctagon, CheckCircle2, Clock, Plus, ShieldAlert, FileText, ClipboardList } from "lucide-react";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/api";

export default function DashboardPage() {
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [diagRes, profileRes, statsRes] = await Promise.all([
          fetchWithAuth("/diagnostics"),
          fetchWithAuth("/users/profile"),
          fetchWithAuth("/dashboard/stats")
        ]);

        if (diagRes.ok) {
          const data = await diagRes.json();
          setDiagnostics(data.diagnostics);
        }
        
        if (profileRes.ok) {
          const data = await profileRes.json();
          setUser(data.user);
        }

        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data.stats);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return null;

  const isColaborador = user?.role === "COLABORADOR";

  return (
    <div className="max-w-6xl mx-auto space-y-8 relative">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[200px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none -z-10"></div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {isColaborador ? `Olá, ${user?.name.split(' ')[0]}` : 'Visão Geral'}
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            {isColaborador 
              ? 'Aqui estão os questionários que você precisa responder.' 
              : 'Acompanhe a conformidade e os riscos da sua empresa.'}
          </p>
        </div>
        {!isColaborador && (
          <Link 
            href="/dashboard/diagnostics/new"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-[0_0_15px_rgba(79,70,229,0.2)] hover:shadow-[0_0_25px_rgba(79,70,229,0.4)]"
          >
            <Plus className="w-5 h-5" />
            Novo Diagnóstico
          </Link>
        )}
      </div>

      {!isColaborador && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <KpiCard 
              title="Nível de Risco Global" 
              value={stats?.globalRiskLevel || "Baixo"} 
              subtitle="Baseado em diagnósticos"
              icon={<AlertOctagon className="w-6 h-6 text-red-400" />} 
              trend={`${stats?.avgScore.toFixed(1) || 0} pts`} 
              trendUp={false} 
            />
            <KpiCard 
              title="Riscos Críticos" 
              value={stats?.criticalRisksCount || 0} 
              subtitle="Identificados ativos"
              icon={<ShieldAlert className="w-6 h-6 text-orange-400" />} 
              trend="Foco" 
              trendUp={false} 
            />
            <KpiCard 
              title="Ações Concluídas" 
              value={stats?.completedActions || 0} 
              subtitle="Planos de ação"
              icon={<CheckCircle2 className="w-6 h-6 text-emerald-400" />} 
              trend="Status" 
              trendUp={true} 
            />
            <KpiCard 
              title="Ações Atrasadas" 
              value={stats?.overdueActions || 0} 
              subtitle="Vencidas"
              icon={<Clock className="w-6 h-6 text-amber-400" />} 
              trend="Alerta" 
              trendUp={true} 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico Mockado */}
            <div className="col-span-2 rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-semibold text-lg text-white">Evolução do Nível de Risco</h3>
                <select className="bg-slate-800 border border-white/10 text-slate-300 text-sm rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500">
                  <option>Últimos 6 meses</option>
                  <option>Este ano</option>
                </select>
              </div>
              <div className="h-64 flex items-end justify-between gap-4 px-2">
                {[45, 60, 55, 75, 40, 30].map((h, i) => (
                  <div key={i} className="w-full flex flex-col items-center gap-3">
                    <div 
                      className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600/20 to-indigo-500 hover:to-indigo-400 transition-all cursor-pointer relative group"
                      style={{ height: `${h}%` }}
                    >
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {h}pts
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">Mês {i+1}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Diagnósticos Recentes (ADM) */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg text-white">Diagnósticos Recentes</h3>
                <button className="text-indigo-400 text-sm hover:text-indigo-300">Ver todos</button>
              </div>
              
              <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                {diagnostics.length === 0 ? (
                  <div className="text-center text-slate-500 mt-10">Nenhum diagnóstico iniciado.</div>
                ) : (
                  diagnostics.map((diag) => (
                    <DiagnosticRow 
                      key={diag.id}
                      id={diag.id}
                      module={diag.module?.name || "NR-1"} 
                      date={new Date(diag.startedAt).toLocaleDateString()} 
                      status={diag.status === 'COMPLETED' ? 'Concluído' : 'Em andamento'} 
                      unit={diag.workplace?.name || "Sede"} 
                      progress={diag.status === 'COMPLETED' ? 100 : 50} 
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {isColaborador && (
        <div className="space-y-6">
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Questionários Pendentes</h3>
                <p className="text-slate-400 text-sm">Responda aos itens abaixo para manter a conformidade da sua unidade.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {diagnostics.filter(d => d.status === 'IN_PROGRESS').length === 0 ? (
                <div className="col-span-2 text-center py-12 bg-white/5 rounded-xl border border-dashed border-white/10">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                  <p className="text-slate-300 font-medium">Parabéns! Tudo em dia.</p>
                  <p className="text-slate-500 text-sm">Você não tem questionários pendentes no momento.</p>
                </div>
              ) : (
                diagnostics.filter(d => d.status === 'IN_PROGRESS').map((diag) => (
                  <Link 
                    key={diag.id}
                    href={`/dashboard/diagnostics/${diag.id}/results`} // Aqui o ideal seria redirecionar para a tela de preenchimento
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                        {diag.module?.name.substring(0, 4)}
                      </div>
                      <div>
                        <div className="text-slate-200 font-medium group-hover:text-indigo-400 transition-colors">{diag.template?.name || 'Diagnóstico de Riscos'}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          Iniciado em {new Date(diag.startedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                      Responder
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ title, value, subtitle, icon, trend, trendUp }: any) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm p-6 group hover:bg-slate-800/50 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5">
          {icon}
        </div>
        <div className={`px-2 py-1 rounded-md text-xs font-medium ${trendUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
          {trend}
        </div>
      </div>
      <div>
        <h4 className="text-3xl font-bold text-white mb-1">{value}</h4>
        <div className="text-sm font-medium text-slate-300">{title}</div>
        <div className="text-xs text-slate-500 mt-1">{subtitle}</div>
      </div>
    </div>
  );
}

function DiagnosticRow({ id, module, date, status, unit, progress }: any) {
  return (
    <Link href={`/dashboard/diagnostics/${id}/results`} className="flex flex-col gap-2 p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group block">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/20">
            {module.substring(0, 4)}
          </div>
          <div>
            <div className="text-sm font-medium text-slate-200 group-hover:text-indigo-300 transition-colors">{unit}</div>
            <div className="text-xs text-slate-500">{date}</div>
          </div>
        </div>
        <div className={`text-xs px-2 py-1 rounded-md font-medium ${status === 'Concluído' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
          {status}
        </div>
      </div>
      {status === 'Em andamento' && (
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
      )}
    </Link>
  );
}
