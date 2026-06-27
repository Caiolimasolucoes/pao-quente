'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import { Plus, Shield, UserCheck, UserX, Eye, EyeOff, Building2, History, PlayCircle, Pencil, Lock } from 'lucide-react';
import type { PerfilUsuario } from '@/types';
import { usePermissoes, TODAS_ABAS, ABAS_POR_PERFIL } from '@/contexts/PermissoesContext';
import { useUnit } from '@/contexts/UnitContext';
import { navItems } from '@/components/layout/Sidebar';

const perfilConfig: Record<PerfilUsuario, { color: string; desc: string }> = {
  Administrador:      { color: 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20', desc: 'Acesso total ao sistema' },
  'Gestor Financeiro':{ color: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',       desc: 'DRE, indicadores e lançamentos' },
  Operacional:        { color: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',    desc: 'Lançamento de compras e cadastros' },
  Visualizador:       { color: 'bg-gray-100 text-gray-600 ring-1 ring-gray-500/20',      desc: 'Somente consulta' },
};

const PERFIS: PerfilUsuario[] = ['Administrador','Gestor Financeiro','Operacional','Visualizador'];

function initials(nome: string) {
  return nome.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

type Usuario = {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  unidade_restrita: string | null;
  ver_historico_faturamento: boolean;
  ver_indicadores_sensiveis: boolean;
};

function emptyForm(): Omit<Usuario, 'id'> {
  return {
    nome: '', email: '', perfil: 'Operacional', ativo: true,
    unidade_restrita: null, ver_historico_faturamento: true, ver_indicadores_sensiveis: false,
  };
}

// FormFields fora do componente pai para evitar remontagem a cada keystroke
function FormFields({
  f, setF, unidades,
}: {
  f: Omit<Usuario, 'id'>;
  setF: (v: Omit<Usuario, 'id'>) => void;
  unidades: { id: string; nome: string }[];
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Nome Completo *</label>
          <input type="text" placeholder="Nome do colaborador" value={f.nome}
            onChange={e => setF({ ...f, nome: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs font-medium text-gray-700 mb-1.5">E-mail *</label>
          <input type="email" placeholder="colaborador@paoquente.com.br" value={f.email}
            onChange={e => setF({ ...f, email: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Perfil de Acesso</label>
          <select value={f.perfil} onChange={e => setF({ ...f, perfil: e.target.value as PerfilUsuario })}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
            {PERFIS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Acesso às Unidades</label>
          <select value={f.unidade_restrita ?? ''} onChange={e => setF({ ...f, unidade_restrita: e.target.value || null })}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
            <option value="">Todas as unidades</option>
            {unidades.map(u => <option key={u.id} value={u.id}>Somente {u.nome}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-700">Permissões adicionais</p>
        <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 accent-amber-600"
            checked={f.ver_historico_faturamento}
            onChange={e => setF({ ...f, ver_historico_faturamento: e.target.checked })} />
          Ver histórico de faturamento
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 accent-amber-600"
            checked={f.ver_indicadores_sensiveis}
            onChange={e => setF({ ...f, ver_indicadores_sensiveis: e.target.checked })} />
          Ver indicadores sensíveis (DRE, lucro, margens)
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 accent-amber-600"
            checked={f.ativo}
            onChange={e => setF({ ...f, ativo: e.target.checked })} />
          Usuário ativo
        </label>
      </div>
    </>
  );
}

export default function UsuariosPage() {
  const { unidades }       = useUnit();
  const { setPermissoes }  = usePermissoes();

  const [listaUsuarios, setListaUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando]       = useState(true);
  const [salvando, setSalvando]           = useState(false);
  const [erro, setErro]                   = useState('');

  // Modal novo usuário
  const [modalOpen, setModalOpen]         = useState(false);
  const [form, setForm]                   = useState(emptyForm());
  const [formSenha, setFormSenha]         = useState('');
  const [showSenha, setShowSenha]         = useState(false);
  const [abasSel, setAbasSel]             = useState<string[]>(TODAS_ABAS);
  const [pResFinanceiro, setPResFinanceiro] = useState(true);
  const [pResCompras, setPResCompras]     = useState(true);

  // Modal editar usuário
  const [editModalOpen, setEditModalOpen]   = useState(false);
  const [editando, setEditando]             = useState<Usuario | null>(null);
  const [editForm, setEditForm]             = useState(emptyForm());
  const [erroEdit, setErroEdit]             = useState('');
  const [salvandoEdit, setSalvandoEdit]     = useState(false);
  const [editAbasSel, setEditAbasSel]       = useState<string[]>(TODAS_ABAS);
  const [editResFinanceiro, setEditResFin]  = useState(true);
  const [editResCompras, setEditResComp]    = useState(true);

  async function carregarUsuarios() {
    const res = await fetch('/api/usuarios');
    const data = res.ok ? await res.json() : [];
    setListaUsuarios(data as Usuario[]);
    setCarregando(false);
  }

  useEffect(() => { carregarUsuarios(); }, []);

  // Quando o perfil muda no form de edição, atualiza as abas automaticamente
  useEffect(() => {
    if (editModalOpen) setEditAbasSel(ABAS_POR_PERFIL[editForm.perfil] ?? TODAS_ABAS);
  }, [editForm.perfil, editModalOpen]);

  function toggleAba(href: string) {
    setAbasSel(prev => prev.includes(href) ? prev.filter(a => a !== href) : [...prev, href]);
  }

  function handleAbrir() {
    setForm(emptyForm());
    setFormSenha('');
    setShowSenha(false);
    setAbasSel(TODAS_ABAS);
    setPResFinanceiro(true);
    setPResCompras(true);
    setErro('');
    setModalOpen(true);
  }

  async function handleSalvar() {
    if (!form.nome.trim()) { setErro('Informe o nome do colaborador.'); return; }
    if (!form.email.trim()) { setErro('Informe o e-mail.'); return; }
    if (!formSenha.trim()) { setErro('Defina uma senha provisória para o colaborador.'); return; }
    if (formSenha.trim().length < 6) { setErro('A senha deve ter pelo menos 6 caracteres.'); return; }
    setSalvando(true); setErro('');
    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, senha: formSenha }),
    });
    const json = await res.json();
    if (!res.ok) { setErro('Erro ao salvar: ' + json.error); setSalvando(false); return; }
    await carregarUsuarios();
    setPermissoes(
      abasSel, pResFinanceiro, pResCompras,
      form.ver_historico_faturamento,
      form.ver_indicadores_sensiveis,
      form.unidade_restrita || null,
      form.nome || 'Novo Usuário',
    );
    setSalvando(false);
    setModalOpen(false);
  }

  function toggleEditAba(href: string) {
    setEditAbasSel(prev => prev.includes(href) ? prev.filter(a => a !== href) : [...prev, href]);
  }

  function handleOpenEditar(u: Usuario) {
    setEditando(u);
    setEditForm({
      nome: u.nome, email: u.email, perfil: u.perfil, ativo: u.ativo,
      unidade_restrita: u.unidade_restrita,
      ver_historico_faturamento: u.ver_historico_faturamento,
      ver_indicadores_sensiveis: u.ver_indicadores_sensiveis,
    });
    setEditAbasSel(ABAS_POR_PERFIL[u.perfil] ?? TODAS_ABAS);
    setEditResFin(u.ver_indicadores_sensiveis);
    setEditResComp(true);
    setErroEdit('');
    setEditModalOpen(true);
  }

  async function handleSalvarEdicao() {
    if (!editando) return;
    if (!editForm.nome.trim()) { setErroEdit('Informe o nome.'); return; }
    setSalvandoEdit(true); setErroEdit('');
    const res = await fetch('/api/usuarios', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editando.id, ...editForm }),
    });
    const json = await res.json();
    if (!res.ok) { setErroEdit('Erro ao salvar: ' + json.error); setSalvandoEdit(false); return; }
    await carregarUsuarios();
    setPermissoes(
      editAbasSel, editResFinanceiro, editResCompras,
      editForm.ver_historico_faturamento,
      editForm.ver_indicadores_sensiveis,
      editForm.unidade_restrita || null,
      editForm.nome || 'Usuário',
    );
    setSalvandoEdit(false);
    setEditModalOpen(false);
    setEditando(null);
  }

  const ativos   = listaUsuarios.filter(u => u.ativo).length;
  const inativos = listaUsuarios.length - ativos;

  function unitLabel(uid: string | null) {
    if (!uid) return null;
    const u = unidades.find(u => u.id === uid);
    return u ? `Só ${u.nome}` : uid;
  }

  return (
    <>
      <Header title="Usuários e Permissões" />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Total de Usuários</p>
            <p className="text-xl font-bold text-gray-900">{listaUsuarios.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Usuários Ativos</p>
            <p className="text-xl font-bold text-emerald-600">{ativos}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Inativos</p>
            <p className="text-xl font-bold text-gray-400">{inativos}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {(Object.entries(perfilConfig) as [PerfilUsuario, typeof perfilConfig[PerfilUsuario]][]).map(([perfil, cfg]) => (
            <div key={perfil} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} className="text-gray-400" />
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${cfg.color}`}>{perfil}</span>
              </div>
              <p className="text-xs text-gray-500">{cfg.desc}</p>
              <p className="text-xs font-semibold text-gray-700 mt-2">
                {listaUsuarios.filter(u => u.perfil === perfil).length} usuário(s)
              </p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Colaboradores com Acesso</h2>
            <button onClick={handleAbrir}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg"
              style={{ backgroundColor: '#D97706' }}>
              <Plus size={14} /> Novo Usuário
            </button>
          </div>
          {carregando ? (
            <div className="py-16 text-center text-gray-400 text-sm">Carregando…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Colaborador','E-mail','Perfil','Unidade','Permissões adicionais','Status',''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {listaUsuarios.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 text-xs font-bold flex-shrink-0">
                            {initials(u.nome)}
                          </div>
                          <span className="font-medium text-gray-900">{u.nome}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${perfilConfig[u.perfil]?.color ?? 'bg-gray-100 text-gray-600'}`}>
                          {u.perfil}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.unidade_restrita ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full">
                            <Building2 size={10} /> {unitLabel(u.unidade_restrita)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Todas</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${u.ver_historico_faturamento ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' : 'bg-gray-100 text-gray-400'}`}>
                            <History size={10} /> Histórico fat.
                          </span>
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${u.ver_indicadores_sensiveis ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20' : 'bg-gray-100 text-gray-400'}`}>
                            {u.ver_indicadores_sensiveis ? <Eye size={10} /> : <EyeOff size={10} />} Indicadores
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`flex items-center gap-1.5 ${u.ativo ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {u.ativo ? <UserCheck size={14} /> : <UserX size={14} />}
                          <span className="text-xs font-medium">{u.ativo ? 'Ativo' : 'Inativo'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleOpenEditar(u)}
                          className="p-1.5 text-gray-300 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Editar usuário">
                          <Pencil size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {listaUsuarios.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">Nenhum usuário cadastrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-700 mb-2">Permissões adicionais configuráveis por usuário</p>
          <div className="flex flex-wrap gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1.5"><History size={12} className="text-emerald-600" /> <strong>Histórico fat.:</strong> acesso ao histórico completo de faturamento</div>
            <div className="flex items-center gap-1.5"><Eye size={12} className="text-purple-600" /> <strong>Indicadores:</strong> visualizar DRE, lucro e margens</div>
            <div className="flex items-center gap-1.5"><Building2 size={12} className="text-gray-600" /> <strong>Unidade restrita:</strong> acesso limitado a uma só unidade</div>
          </div>
        </div>
      </main>

      {/* ── Modal Novo Usuário ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo Usuário" size="md">
        <div className="space-y-4">
          <FormFields f={form} setF={setForm} unidades={unidades} />

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Senha provisória *</label>
            <div className="relative">
              <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showSenha ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={formSenha}
                onChange={e => setFormSenha(e.target.value)}
                className="w-full pl-8 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button type="button" onClick={() => setShowSenha(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showSenha ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Compartilhe esta senha com o colaborador. Ele poderá alterá-la depois.</p>
          </div>

          {/* Permissões de abas */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2">
              <Shield size={13} className="text-amber-600" />
              <p className="text-xs font-semibold text-gray-700">Acesso às Abas do Sistema</p>
            </div>
            <div className="divide-y divide-gray-50">
              {navItems.map(item => {
                const Icon = item.icon;
                const ativo = abasSel.includes(item.href);
                return (
                  <div key={item.href} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 cursor-pointer" onClick={() => toggleAba(item.href)}>
                    <span className="flex items-center gap-2 text-xs text-gray-700">
                      <Icon size={13} className="text-gray-400 flex-shrink-0" /> {item.label}
                    </span>
                    <div className={`w-8 h-4 rounded-full transition-colors relative flex-shrink-0 ${ativo ? 'bg-amber-500' : 'bg-gray-200'}`}>
                      <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 shadow transition-transform ${ativo ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bg-gray-50 px-4 py-2.5 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-600">Resumos no Dashboard</p>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { key: 'fin', label: 'Resumo financeiro (faturamento, lucro, margens)', value: pResFinanceiro, set: setPResFinanceiro },
                { key: 'cmp', label: 'Resumo de compras (totais por categoria)',        value: pResCompras,    set: setPResCompras },
              ].map(({ key, label, value, set }) => (
                <div key={key} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 cursor-pointer" onClick={() => set(!value)}>
                  <span className="text-xs text-gray-700 pr-4">{label}</span>
                  <div className={`w-8 h-4 rounded-full transition-colors relative flex-shrink-0 ${value ? 'bg-amber-500' : 'bg-gray-200'}`}>
                    <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={handleSalvar} disabled={salvando}
              className="px-5 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: '#D97706' }}>
              <PlayCircle size={14} /> {salvando ? 'Salvando…' : 'Criar e Simular Acesso'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Modal Editar Usuário ── */}
      <Modal open={editModalOpen} onClose={() => { setEditModalOpen(false); setEditando(null); }} title="Editar Usuário" size="md">
        {editando && (
          <div className="space-y-4">
            <FormFields f={editForm} setF={setEditForm} unidades={unidades} />

            {/* Permissões de abas */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2">
                <Shield size={13} className="text-amber-600" />
                <p className="text-xs font-semibold text-gray-700">Acesso às Abas do Sistema</p>
              </div>
              <div className="divide-y divide-gray-50">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const ativo = editAbasSel.includes(item.href);
                  return (
                    <div key={item.href} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 cursor-pointer" onClick={() => toggleEditAba(item.href)}>
                      <span className="flex items-center gap-2 text-xs text-gray-700">
                        <Icon size={13} className="text-gray-400 flex-shrink-0" /> {item.label}
                      </span>
                      <div className={`w-8 h-4 rounded-full transition-colors relative flex-shrink-0 ${ativo ? 'bg-amber-500' : 'bg-gray-200'}`}>
                        <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 shadow transition-transform ${ativo ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="bg-gray-50 px-4 py-2.5 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-600">Resumos no Dashboard</p>
              </div>
              <div className="divide-y divide-gray-50">
                {[
                  { key: 'fin', label: 'Resumo financeiro (faturamento, lucro, margens)', value: editResFinanceiro, set: setEditResFin },
                  { key: 'cmp', label: 'Resumo de compras (totais por categoria)',        value: editResCompras,    set: setEditResComp },
                ].map(({ key, label, value, set }) => (
                  <div key={key} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 cursor-pointer" onClick={() => set(!value)}>
                    <span className="text-xs text-gray-700 pr-4">{label}</span>
                    <div className={`w-8 h-4 rounded-full transition-colors relative flex-shrink-0 ${value ? 'bg-amber-500' : 'bg-gray-200'}`}>
                      <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {erroEdit && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erroEdit}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => { setEditModalOpen(false); setEditando(null); }} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSalvarEdicao} disabled={salvandoEdit}
                className="px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60 flex items-center gap-2" style={{ backgroundColor: '#D97706' }}>
                <PlayCircle size={14} /> {salvandoEdit ? 'Salvando…' : 'Salvar e Simular Acesso'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
