"use client";

import { useState } from "react";
import { Plus, Trash2, Save, GripVertical, FileQuestion, AlignLeft, CheckSquare, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TemplateEditorPage() {
  const [sections, setSections] = useState([
    {
      id: "sec-1",
      title: "Riscos Físicos",
      questions: [
        { id: "q1", text: "Há exposição a ruído contínuo?", type: "SELECT", options: [
          { label: "Sim", isRisk: true, riskCode: "FIS-01" },
          { label: "Não", isRisk: false, riskCode: "" }
        ]}
      ]
    }
  ]);

  const addSection = () => {
    setSections([...sections, { id: `sec-${Date.now()}`, title: "Nova Seção", questions: [] }]);
  };

  const addQuestion = (sectionId: string) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          questions: [...s.questions, { id: `q-${Date.now()}`, text: "Nova Pergunta", type: "SELECT", options: [] }]
        };
      }
      return s;
    }));
  };

  const addOption = (sectionId: string, questionId: string) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          questions: s.questions.map(q => {
            if (q.id === questionId) {
              return { ...q, options: [...q.options, { label: "Nova Opção", isRisk: false, riskCode: "" }] };
            }
            return q;
          })
        };
      }
      return s;
    }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Construtor de Diagnósticos</h1>
          <p className="text-slate-400 mt-1 text-sm">Crie formulários dinâmicos e vincule as respostas à Matriz de Risco.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all shadow-[0_0_15px_rgba(79,70,229,0.2)]">
          <Save className="w-5 h-5" />
          Salvar Template
        </button>
      </div>

      <div className="space-y-6">
        {sections.map((section, sIdx) => (
          <div key={section.id} className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <GripVertical className="w-5 h-5 text-slate-500 cursor-grab" />
              <input 
                type="text" 
                value={section.title}
                onChange={(e) => {
                  const newSecs = [...sections];
                  const sec = newSecs[sIdx];
                  if (!sec) return;
                  sec.title = e.target.value;
                  setSections(newSecs);
                }}
                className="bg-transparent text-xl font-semibold text-white border-b border-transparent hover:border-white/20 focus:border-indigo-500 focus:outline-none px-2 py-1 transition-colors w-full max-w-sm"
              />
            </div>

            <div className="space-y-4 pl-9">
              {section.questions.map((question, qIdx) => (
                <div key={question.id} className="bg-slate-800/50 border border-white/5 rounded-xl p-5">
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-4">
                      <div className="flex gap-3">
                        <FileQuestion className="w-5 h-5 text-slate-400 mt-2" />
                        <textarea
                          value={question.text}
                          onChange={(e) => {
                            const newSecs = [...sections];
                            const sec = newSecs[sIdx];
                            const q = sec?.questions?.[qIdx];
                            if (!sec || !q) return;
                            q.text = e.target.value;
                            setSections(newSecs);
                          }}
                          className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500 resize-none h-12"
                          placeholder="Digite a pergunta..."
                        />
                      </div>

                      {/* Opções */}
                      <div className="pl-8 space-y-2">
                        {question.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-3">
                            <input
                              type="text"
                              value={opt.label}
                              onChange={(e) => {
                                const newSecs = [...sections];
                                const sec = newSecs[sIdx];
                                const q = sec?.questions?.[qIdx];
                                const o = q?.options?.[oIdx];
                                if (!sec || !q || !o) return;
                                o.label = e.target.value;
                                setSections(newSecs);
                              }}
                              className="bg-slate-900 border border-white/10 rounded-md px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 w-48"
                              placeholder="Rótulo da Opção"
                            />
                            
                            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-400">
                              <input 
                                type="checkbox" 
                                checked={opt.isRisk}
                                onChange={(e) => {
                                  const newSecs = [...sections];
                                  const sec = newSecs[sIdx];
                                  const q = sec?.questions?.[qIdx];
                                  const o = q?.options?.[oIdx];
                                  if (!sec || !q || !o) return;
                                  o.isRisk = e.target.checked;
                                  setSections(newSecs);
                                }}
                                className="rounded bg-slate-900 border-white/10 text-indigo-500 focus:ring-indigo-500"
                              />
                              Gera Risco?
                            </label>

                            {opt.isRisk && (
                              <input
                                type="text"
                                value={opt.riskCode}
                                onChange={(e) => {
                                  const newSecs = [...sections];
                                  const sec = newSecs[sIdx];
                                  const q = sec?.questions?.[qIdx];
                                  const o = q?.options?.[oIdx];
                                  if (!sec || !q || !o) return;
                                  o.riskCode = e.target.value;
                                  setSections(newSecs);
                                }}
                                className="bg-red-500/10 border border-red-500/30 rounded-md px-3 py-1.5 text-sm text-red-400 focus:outline-none focus:border-red-500 w-32 placeholder-red-400/50"
                                placeholder="Cód. Risco (ex: FIS-01)"
                              />
                            )}

                            <button className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-white/5 rounded transition-colors ml-auto">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        
                        <button 
                          onClick={() => addOption(section.id, question.id)}
                          className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-2"
                        >
                          <Plus className="w-3 h-3" /> Adicionar Opção
                        </button>
                      </div>
                    </div>

                    <div className="w-48 border-l border-white/10 pl-4 space-y-4">
                      <div>
                        <label className="text-xs text-slate-500 font-medium mb-1.5 block">Tipo da Pergunta</label>
                        <select className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500">
                          <option value="SELECT">Múltipla Escolha</option>
                          <option value="TEXT">Texto Livre</option>
                          <option value="CHECKBOX">Caixa de Seleção</option>
                        </select>
                      </div>
                      <button className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors w-full">
                        <Trash2 className="w-4 h-4" />
                        Excluir Pergunta
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button 
                onClick={() => addQuestion(section.id)}
                className="w-full py-3 border border-dashed border-white/20 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar Pergunta à {section.title}
              </button>
            </div>
          </div>
        ))}

        <button 
          onClick={addSection}
          className="w-full py-4 bg-slate-900/50 border border-white/10 rounded-2xl text-slate-300 font-medium hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Adicionar Nova Seção
        </button>
      </div>
    </div>
  );
}
