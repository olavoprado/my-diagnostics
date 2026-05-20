"use client";

import React, { useEffect, useState, use } from "react";
import { ArrowLeft, Loader2, FileText, Calendar, MapPin, Building2, CheckCircle2, AlertTriangle, User, Clock } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function DiagnosticResultsPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetchWithAuth(`/diagnostics/${params.id}/results`);
        if (res.ok) {
          const data = await res.json();
          setDiagnostic(data.diagnostic);
        } else {
          const errData = await res.json();
          setError(errData.message || "Erro ao carregar diagnóstico");
        }
      } catch (error) {
        console.error(error);
        setError("Erro de conexão com o servidor");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !diagnostic) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-medium text-slate-200">{error || "Diagnóstico não encontrado"}</h2>
        <Link href="/dashboard/diagnostics" className="text-indigo-400 mt-4 inline-block hover:underline">
          Voltar para a Lista
        </Link>
      </div>
    );
  }

  // Create a quick map to find answers by questionId
  const answersMap: Record<string, any> = {};
  diagnostic.answers?.forEach((a: any) => {
    answersMap[a.questionId] = a;
  });

  const hasAnswers = diagnostic.answers && diagnostic.answers.length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <Link href="/dashboard/diagnostics" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Voltar para Diagnósticos
      </Link>

      <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] -z-10" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-4">Relatório de Diagnóstico</h1>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 bg-indigo-500/10 text-indigo-300 px-3 py-1.5 rounded-lg border border-indigo-500/20 text-xs font-medium">
                <FileText className="w-3.5 h-3.5" />
                {diagnostic.template?.name}
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-white/5 text-xs font-medium">
                <MapPin className="w-3.5 h-3.5" />
                {diagnostic.workplace?.name}
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-white/5 text-xs font-medium">
                <User className="w-3.5 h-3.5" />
                Responsável: <span className="text-white ml-1">{diagnostic.responsibleUser?.name || 'Não atribuído'}</span>
              </div>
            </div>
          </div>

          <div className={cn(
            "px-4 py-2 rounded-xl border text-center",
            diagnostic.status === 'COMPLETED' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"
          )}>
            <div className="text-[10px] uppercase tracking-wider font-bold mb-0.5 opacity-70">Status</div>
            <div className="text-sm font-bold">{diagnostic.status === 'COMPLETED' ? "CONCLUÍDO" : "EM ANDAMENTO"}</div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden p-8">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-indigo-400" />
          Respostas Coletadas
        </h2>

        <div className="space-y-8">
          {diagnostic.template?.sections?.map((section: any) => (
            <div key={section.id} className="border-t border-white/10 pt-6 first:border-0 first:pt-0">
              <h3 className="text-lg font-medium text-slate-200 mb-4">{section.title}</h3>
              
              <div className="space-y-4">
                {section.questions?.map((question: any) => {
                  const answer = answersMap[question.id];
                  
                  return (
                    <div key={question.id} className="bg-slate-950/50 rounded-xl p-4 border border-white/5 group hover:border-white/10 transition-colors">
                      <p className="text-sm font-medium text-slate-300 mb-3">{question.text}</p>
                      
                      {!answer ? (
                        <div className="text-xs text-slate-500 italic flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" />
                          Aguardando resposta do colaborador...
                        </div>
                      ) : (
                        <div>
                          {question.type === 'SELECT' && answer.optionIds && answer.optionIds.length > 0 && (
                            <div className="flex gap-2">
                              {answer.optionIds.map((optId: string) => {
                                const optInfo = question.options?.find((o: any) => o.id === optId);
                                const isRisk = optInfo?.riskItemId;
                                return (
                                  <div key={optId} className={cn(
                                    "px-3 py-1.5 rounded-lg text-sm border font-medium flex items-center gap-2",
                                    isRisk ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                  )}>
                                    {isRisk && <AlertTriangle className="w-3.5 h-3.5" />}
                                    {optInfo?.label || "Desconhecida"}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {question.type === 'TEXT' && (
                            <div className="text-sm text-slate-400 bg-white/5 p-3 rounded-lg border border-white/5">
                              {answer.textValue}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

