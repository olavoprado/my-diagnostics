"use client";

import { useEffect, useState } from "react";
import { Building2, Save, User, Loader2, Image as ImageIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { fetchWithAuth } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();
  
  const logoUrl = watch("logoUrl");

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetchWithAuth("/users/profile");
        if (response.ok) {
          const data = await response.json();
          setUserProfile(data.user);
          setValue("companyName", data.company.name);
          setValue("cnpj", data.company.cnpj);
          setValue("logoUrl", data.company.logoUrl || "");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [setValue]);

  const onSubmit = async (data: any) => {
    setIsSaving(true);
    try {
      const response = await fetchWithAuth("/companies/active", {
        method: "PUT",
        body: JSON.stringify({
          name: data.companyName,
          cnpj: data.cnpj,
          logoUrl: data.logoUrl
        })
      });
      if (response.ok) {
        alert("Configurações atualizadas com sucesso!");
      }
    } catch (err) {
      alert("Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
        <p className="text-slate-400">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Configurações</h1>
        <p className="text-slate-400 mt-1 text-sm">Gerencie os dados da sua empresa e do seu perfil.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Formulário Principal */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              Dados da Empresa
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Razão Social</label>
                <input
                  type="text"
                  {...register("companyName", { required: true })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">CNPJ</label>
                <input
                  type="text"
                  {...register("cnpj")}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">URL da Logomarca (Será impressa no PDF)</label>
                <input
                  type="url"
                  {...register("logoUrl")}
                  placeholder="https://..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all shadow-[0_0_15px_rgba(79,70,229,0.2)] disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar / Preview */}
        <div className="space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Pré-visualização do Logo</h2>
            <div className="aspect-square bg-white/5 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden p-4">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
              ) : (
                <div className="text-center text-slate-500">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <span className="text-xs">Sem logo</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="w-4 h-4" />
              Seu Perfil
            </h2>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-slate-500">Nome</div>
                <div className="text-slate-200 font-medium">{userProfile?.name}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">E-mail</div>
                <div className="text-slate-200 font-medium">{userProfile?.email}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Nível de Acesso</div>
                <div className="inline-flex mt-1 px-2 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-semibold rounded">
                  {userProfile?.role}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
