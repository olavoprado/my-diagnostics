"use client";

import { useEffect, useState } from "react";
import { Users, UserPlus, Mail, Shield, ShieldAlert, CheckCircle2, Loader2, Info } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", role: "COLABORADOR" });

  const fetchUsers = async () => {
    try {
      const res = await fetchWithAuth("/users/company");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetchWithAuth("/users/profile");
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchUsers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await fetchWithAuth("/users/company", {
        method: "POST",
        body: JSON.stringify(inviteForm)
      });
      if (res.ok) {
        setShowInviteModal(false);
        setInviteForm({ name: "", email: "", role: "COLABORADOR" });
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.message || "Erro ao convidar usuário.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Gestão de Usuários</h1>
          <p className="text-slate-400 mt-1 text-sm">Controle quem tem acesso à plataforma da sua empresa.</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-[0_0_15px_rgba(79,70,229,0.2)] hover:shadow-[0_0_25px_rgba(79,70,229,0.4)]"
        >
          <UserPlus className="w-5 h-5" />
          Convidar Usuário
        </button>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-slate-800/50">
              <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Nível de Acesso</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((uc, idx) => (
              <tr key={idx} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                      {uc.user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-slate-200">{uc.user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-500" />
                    {uc.user.email}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border",
                    uc.role === 'ADMIN' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                    uc.role === 'GESTOR' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                    "bg-slate-500/10 text-slate-400 border-slate-500/20"
                  )}>
                    {uc.role === 'ADMIN' ? <ShieldAlert className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                    {uc.role}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="inline-flex items-center gap-1.5 text-emerald-400 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    Ativo
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  Nenhum usuário encontrado na empresa.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Convidar Novo Usuário</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 flex gap-3 text-sm text-indigo-300">
                <Info className="w-5 h-5 shrink-0" />
                <p>No MVP, a senha padrão será <strong>senha123</strong> caso o usuário não tenha conta na plataforma.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome Completo</label>
                <input 
                  required
                  type="text" 
                  value={inviteForm.name}
                  onChange={e => setInviteForm({...inviteForm, name: e.target.value})}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2.5 text-slate-200 outline-none focus:border-indigo-500"
                  placeholder="Ex: Carlos Silva"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">E-mail Corporativo</label>
                <input 
                  required
                  type="email" 
                  value={inviteForm.email}
                  onChange={e => setInviteForm({...inviteForm, email: e.target.value})}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2.5 text-slate-200 outline-none focus:border-indigo-500"
                  placeholder="Ex: carlos@empresa.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Nível de Acesso (Papel)</label>
                <select 
                  value={inviteForm.role}
                  onChange={e => setInviteForm({...inviteForm, role: e.target.value})}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2.5 text-slate-200 outline-none focus:border-indigo-500 appearance-none"
                >
                  <option value="COLABORADOR">Colaborador (Responde questionários)</option>
                  <option value="GESTOR">Gestor (Analisa dados e cria planos de ação)</option>
                  {currentUser?.role === 'ADMIN' && (
                    <option value="ADMIN">Administrador (Acesso total)</option>
                  )}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={inviting}
                  className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors font-medium flex justify-center items-center gap-2"
                >
                  {inviting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Convidar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
