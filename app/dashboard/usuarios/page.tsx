'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import { usuarios } from '@/lib/mock-data';
import { Plus, Shield, UserCheck, UserX, Eye, EyeOff, Building2, History, PlayCircle } from 'lucide-react';
import type { PerfilUsuario } from '@/types';
import { usePermissoes, TODAS_ABAS } from '@/contexts/PermissoesContext';
import { navItems } from '@/components/layout/Sidebar';

const perfilConfig: Record<PerfilUsuario, { color: string; desc: string }> = {
  Administrador:      { color: 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20', desc: 'Acesso total ao sistema' },
  'Gestor Financeiro':{ color: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',       desc: 'DRE, indicadores e lançamentos' },
  Operacional:        { color: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',    desc: 'Lançamento de compras e cadastros' },
  Visualizador:       { color: 'bg-gray-100 text-gray-600 ring-1 ring-gray-500/20',      desc: 'Somente consulta' },
};

const unidadeRestritaLabel: Record<string, string> = {
  '1': 'Só Centro',
  '2': 'Só Bairro',
};

function initials(nome: string) {
  return nome.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

export default function UsuariosPage() {
  const [modalOpen, setModalOpen]       = useState(false);
  const [nomeNovoUser, setNomeNovoUser] = useState('');
  const [abasSel, setAbasSel]           = useState<string[]>(TODAS_ABAS);
  const [pResFinanceiro, setPResFinanceiro] = useState(true);
  const [pResCompras, setPResCompras]   = useState(true);
  const { setPermissoes } = usePermissoes();

  const ativos = usuarios.filter((u) => u.ativo).length;

  function toggleAba(href: string) {
    setAbasSel((prev) =>
      prev.includes(href) ? prev.filter((a) => a !== href) : [...prev, href],
    );
  }

  function handleAbrir() {
    setNomeNovoUser('');
    setAbasSel(TODAS_ABAS);
    setPResFinanceiro(true);
    setPResCompras(true);
    setModalOpen(true);
  }

  function handleSalvarSimular() {
    setPermissoes(abasSel, pResFinanceiro, pResCompras, nomeNovoUser || 'Novo Usuário');
    setModalOpen(false);
  }

  return (
    <>
      <Header title="Usuários e Permissões" />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Total de Usuários</p>
            <p className="text-xl font-bold text-gray-900">{usuarios.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Usuários Ativos</p>
            <p className="text-xl font-bold text-emerald-600">{ativos}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Inativos</p>
            <p className="text-xl font-bold text-gray-400">{usuarios.length - ativos}</p>
          </div>
        </div>

        {/* Perfis */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {(Object.entries(perfilConfig) as [PerfilUsuario, typeof perfilConfig[PerfilUsuario]][]).map(([perfil, cfg]) => (
            <div key={perfil} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} className="text-gray-400" />
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${cfg.color}`}>{perfil}</span>
              </div>
              <p className="text-xs text-gray-500">{cfg.desc}</p>
              <p className="text-xs font-semibold text-gray-700 mt-2">
                {usuarios.filter((u) => u.perfil === perfil).length} usuário(s)
              </p>
            </div>
          ))}
        </div>

        {/* Tabela de usuários */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Colaboradores com Acesso</h2>
            <button
              onClick={handleAbrir}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg"
              style={{ backgroundColor: '#D97706' }}
            >
              <Plus size={14} /> Novo Usuário
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Colaborador', 'E-mail', 'Perfil', 'Unidade', 'Permissões adicionais', 'Status', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usuarios.map((u) => (
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
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${perfilConfig[u.perfil].color}`}>
                        {u.perfil}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.unidadeRestrita ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full">
                          <Building2 size={10} /> {unidadeRestritaLabel[u.unidadeRestrita]}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Todas</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          title="Ver histórico de faturamento"
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                            u.verHistoricoFaturamento
                              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          <History size={10} />
                          Histórico fat.
                        </span>
                        <span
                          title="Ver indicadores sensíveis (DRE, lucro, margens)"
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                            u.verIndicadoresSensiveis
                              ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {u.verIndicadoresSensiveis ? <Eye size={10} /> : <EyeOff size={10} />}
                          Indicadores
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
                      <button className="text-xs text-amber-700 hover:text-amber-900 font-medium">Editar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legenda permissões */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-700 mb-2">Permissões adicionais configuráveis por usuário</p>
          <div className="flex flex-wrap gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1.5"><History size={12} className="text-emerald-600" /> <strong>Histórico fat.:</strong> acesso ao histórico completo de faturamento (não só o dia atual)</div>
            <div className="flex items-center gap-1.5"><Eye size={12} className="text-purple-600" /> <strong>Indicadores:</strong> visualizar DRE, lucro e margens</div>
            <div className="flex items-center gap-1.5"><Building2 size={12} className="text-gray-600" /> <strong>Unidade restrita:</strong> acesso limitado a uma só unidade</div>
          </div>
        </div>
      </main>

      {/* Modal Novo Usuário */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo Usuário" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Nome Completo</label>
            <input
              type="text"
              placeholder="Nome do colaborador"
              value={nomeNovoUser}
              onChange={(e) => setNomeNovoUser(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">E-mail</label>
            <input type="email" placeholder="colaborador@paoquente.com.br" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Perfil de Acesso</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                <option>Administrador</option>
                <option>Gestor Financeiro</option>
                <option>Operacional</option>
                <option>Visualizador</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Acesso às Unidades</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                <option value="">Todas as unidades</option>
                <option value="1">Somente Centro</option>
                <option value="2">Somente Bairro</option>
              </select>
            </div>
          </div>

          {/* ── Seção de permissões de abas ── */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2">
              <Shield size={13} className="text-amber-600" />
              <p className="text-xs font-semibold text-gray-700">Acesso às Abas do Sistema</p>
            </div>
            <div className="divide-y divide-gray-50">
              {navItems.map((item) => {
                const Icon = item.icon;
                const ativo = abasSel.includes(item.href);
                return (
                  <div
                    key={item.href}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleAba(item.href)}
                  >
                    <span className="flex items-center gap-2 text-xs text-gray-700">
                      <Icon size={13} className="text-gray-400 flex-shrink-0" />
                      {item.label}
                    </span>
                    <div className={`w-8 h-4 rounded-full transition-colors relative flex-shrink-0 ${ativo ? 'bg-amber-500' : 'bg-gray-200'}`}>
                      <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 shadow transition-transform ${ativo ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Resumos */}
            <div className="bg-gray-50 px-4 py-2.5 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-600">Resumos no Dashboard</p>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { key: 'fin', label: 'Resumo financeiro (faturamento, lucro, margens)', value: pResFinanceiro, set: setPResFinanceiro },
                { key: 'cmp', label: 'Resumo de compras (totais por categoria)',        value: pResCompras,    set: setPResCompras },
              ].map(({ key, label, value, set }) => (
                <div
                  key={key}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 cursor-pointer"
                  onClick={() => set(!value)}
                >
                  <span className="text-xs text-gray-700 pr-4">{label}</span>
                  <div className={`w-8 h-4 rounded-full transition-colors relative flex-shrink-0 ${value ? 'bg-amber-500' : 'bg-gray-200'}`}>
                    <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <p className="text-xs font-medium text-gray-700">Permissões adicionais</p>
            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-amber-600" defaultChecked />
              Ver histórico de faturamento
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-amber-600" />
              Ver indicadores sensíveis (DRE, lucro, margens)
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Senha inicial</label>
            <input type="password" placeholder="••••••••" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
            <button
              onClick={handleSalvarSimular}
              className="px-5 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2"
              style={{ backgroundColor: '#D97706' }}
            >
              <PlayCircle size={14} /> Criar e Simular Acesso
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
