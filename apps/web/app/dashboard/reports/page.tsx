"use client";

import { useState } from "react";
import { FileText, Download, FileArchive, Loader2 } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";

const mockReports = [
  {
    id: "1",
    title: "PGR - Programa de Gerenciamento de Riscos",
    unit: "Matriz - São Paulo",
    date: "28/04/2026",
    status: "ready",
    type: "PDF",
    size: "2.4 MB"
  }
];

export default function ReportsPage() {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPGR = async () => {
    try {
      setIsDownloading(true);

      // Primeiro busca o perfil para pegar a empresa/workplace ativo
      const profileRes = await fetchWithAuth("/users/profile");
      if (!profileRes.ok) throw new Error("Falha ao buscar perfil");
      const profile = await profileRes.json();
      
      const workplaces = profile.company?.workplaces || [];
      if (workplaces.length === 0) throw new Error("Nenhuma unidade (workplace) encontrada para gerar o PGR.");
      
      // Usa o primeiro workplace por padrão (MVP)
      const workplaceId = workplaces[0].id;
      
      const response = await fetchWithAuth(`/reports/pgr/${workplaceId}`);
      if (!response.ok) throw new Error("Falha ao gerar relatório no servidor");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PGR_${profile.company.name}_${new Date().getFullYear()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Erro no download:", err);
      alert(err.message || "Erro ao gerar o documento.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Central de Relatórios</h1>
          <p className="text-slate-400 mt-1 text-sm">Gere, exporte e gerencie a documentação oficial da sua empresa.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card de Geração Rápida do PGR */}
        <div className="col-span-1 md:col-span-3 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden flex items-center justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none -z-10"></div>
          
          <div className="flex gap-6 items-center z-10">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shadow-[0_0_15px_rgba(79,70,229,0.2)]">
              <FileText className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Gerar PGR (PDF Oficial)</h2>
              <p className="text-indigo-200/80 text-sm mt-1 max-w-lg">
                Gere o documento final baseando-se no diagnóstico NR-1 mais recente, incluindo a matriz de riscos atualizada e o cronograma do plano de ação.
              </p>
            </div>
          </div>
          
          <button 
            disabled={isDownloading}
            onClick={handleDownloadPGR}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl font-semibold transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:-translate-y-0.5 z-10"
          >
            {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {isDownloading ? "Gerando PDF..." : "Baixar PGR Agora"}
          </button>
        </div>

        {/* Histórico */}
        <div className="col-span-1 md:col-span-3">
          <h3 className="font-semibold text-lg text-slate-200 mb-4">Arquivos Recentes</h3>
          <div className="bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/50 text-slate-400 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-medium">Documento</th>
                  <th className="px-6 py-4 font-medium">Unidade</th>
                  <th className="px-6 py-4 font-medium">Data</th>
                  <th className="px-6 py-4 font-medium">Tamanho</th>
                  <th className="px-6 py-4 font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {mockReports.map((report) => (
                  <tr key={report.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {report.type === 'PDF' ? (
                          <FileText className="w-5 h-5 text-red-400" />
                        ) : (
                          <FileArchive className="w-5 h-5 text-emerald-400" />
                        )}
                        <span className="font-medium text-slate-200">{report.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{report.unit}</td>
                    <td className="px-6 py-4 text-slate-400">{report.date}</td>
                    <td className="px-6 py-4 text-slate-400">{report.size}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-indigo-400 hover:text-indigo-300 font-medium text-sm flex items-center justify-end gap-1.5 ml-auto">
                        <Download className="w-4 h-4" />
                        Baixar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
