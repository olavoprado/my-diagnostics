"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, AlertTriangle, CheckCircle2, ChevronRight, FileQuestion, Loader2, User, Building2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { fetchWithAuth } from "@/lib/api";

export default function NewDiagnosticPage() {
  const router = useRouter();
  const [template, setTemplate] = useState<any>(null);
  const [diagnosticId, setDiagnosticId] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Setup data
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isSetupDone, setIsSetupDone] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [tplRes, usersRes, profileRes] = await Promise.all([
          fetchWithAuth("/forms/mock-nr1"),
          fetchWithAuth("/users/company"),
          fetchWithAuth("/users/profile")
        ]);

        if (tplRes.ok) {
          const data = await tplRes.json();
          setTemplate(data.template);
        }

        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(data.users || []);
        }

        if (profileRes.ok) {
          const data = await profileRes.json();
          setCurrentUser(data.user);
          setSelectedUserId(data.user.id); // Default to current user
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const handleStartDiagnostic = async () => {
    if (!template) return;
    setIsCreating(true);
    try {
      const res = await fetchWithAuth("/diagnostics", {
        method: "POST",
        body: JSON.stringify({ 
          formTemplateId: template.id,
          responsibleUserId: selectedUserId
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        // Se eu atribuí para OUTRA pessoa, eu não respondo agora.
        // Volto para a lista com uma mensagem de sucesso.
        if (selectedUserId !== currentUser.id) {
          alert("Diagnóstico atribuído com sucesso! O responsável já pode visualizá-lo em sua conta.");
          router.push("/dashboard/diagnostics");
          return;
        }

        // Se eu atribuí para MIM mesmo, eu sigo para responder.
        setDiagnosticId(data.diagnostic.id);
        setIsSetupDone(true);
      } else {
        alert("Erro ao criar diagnóstico.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleFinish = async () => {
    if (!diagnosticId) return;
    setIsSaving(true);
    try {
      const payloadAnswers = Object.entries(answers).map(([qId, val]) => {
        let optionId = "";
        template.sections.forEach((sec: any) => {
          sec.questions.forEach((q: any) => {
            if (q.id === qId) {
              const opt = q.options.find((o: any) => o.value === val);
              if (opt) optionId = opt.id;
            }
          });
        });

        return {
          questionId: qId,
          textValue: val,
          optionIds: optionId ? [optionId] : []
        };
      });

      const res = await fetchWithAuth(`/diagnostics/${diagnosticId}/answers`, {
        method: "POST",
        body: JSON.stringify({ answers: payloadAnswers })
      });

      if (res.ok) {
        alert("Diagnóstico concluído!");
        router.push("/dashboard");
      } else {
        alert("Erro ao salvar as respostas.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
        <p className="text-slate-400">Carregando...</p>
      </div>
    );
  }

  // Step 1: Setup Screen (Assign to user)
  if (!isSetupDone) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Novo Diagnóstico</h1>
            <p className="text-slate-400 text-sm mt-1">Configure quem será responsável por responder este formulário.</p>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Selecione o Responsável</label>
            <div className="grid grid-cols-1 gap-3">
              {users.map((uc) => (
                <button
                  key={uc.user.id}
                  onClick={() => setSelectedUserId(uc.user.id)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border text-left transition-all",
                    selectedUserId === uc.user.id 
                      ? "bg-indigo-500/10 border-indigo-500/50 text-white" 
                      : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/5">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium">{uc.user.name}</div>
                      <div className="text-xs text-slate-500">{uc.role}</div>
                    </div>
                  </div>
                  {selectedUserId === uc.user.id && <CheckCircle2 className="w-5 h-5 text-indigo-400" />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-white/10">
            <button
              disabled={isCreating || !selectedUserId}
              onClick={handleStartDiagnostic}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Iniciar Diagnóstico"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const section = template.sections[currentSection];
  const isLastSection = currentSection === template.sections.length - 1;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{template.name}</h1>
            <p className="text-slate-400 text-sm mt-1">{template.description}</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium text-slate-300">
            Passo {currentSection + 1} de {template.sections.length}
          </span>
          <span className="text-sm font-semibold text-indigo-400">
            {Math.round(((currentSection) / template.sections.length) * 100)}% Concluído
          </span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 transition-all duration-500 ease-in-out"
            style={{ width: `${((currentSection + 1) / template.sections.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Engine Viewer */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-xl">
        <h2 className="text-xl font-semibold text-white mb-8 border-b border-white/10 pb-4">
          {section.title}
        </h2>

        <div className="space-y-8">
          {section.questions.map((q: any) => (
            <div key={q.id} className="space-y-4">
              <label className="flex items-start gap-3 text-slate-200 font-medium text-lg">
                <FileQuestion className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                {q.text}
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pl-8">
                {q.options.map((opt: any) => {
                  const isSelected = answers[q.id] === opt.value;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleAnswer(q.id, opt.value)}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-xl border text-left transition-all",
                        isSelected 
                          ? "bg-indigo-500/10 border-indigo-500/50 text-white shadow-[0_0_15px_rgba(79,70,229,0.15)]"
                          : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                        isSelected ? "border-indigo-500" : "border-slate-600"
                      )}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                      </div>
                      <span className="font-medium text-sm">{opt.label}</span>
                      
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-400 ml-auto" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="mt-12 pt-6 border-t border-white/10 flex justify-between items-center">
          <button
            disabled={currentSection === 0}
            onClick={() => setCurrentSection(prev => prev - 1)}
            className="px-6 py-2.5 text-sm font-medium text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>
          
          <button
            disabled={isSaving}
            onClick={() => {
              if (!isLastSection) setCurrentSection(prev => prev + 1);
              else handleFinish();
            }}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all shadow-[0_0_15px_rgba(79,70,229,0.2)] disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isLastSection ? "Finalizar Diagnóstico" : "Próxima Seção"}
            {!isLastSection && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
