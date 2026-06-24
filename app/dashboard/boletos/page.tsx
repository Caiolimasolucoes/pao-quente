'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import { boletos, fornecedores, categoriasBoleto, unidadesPadaria } from '@/lib/mock-data';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, AlertCircle, Link2, Building2 } from 'lucide-react';
import { useUnit } from '@/contexts/UnitContext';
import type { StatusBoleto } from '@/types';

const filtrosStatus: { label: string; value: StatusBoleto | 'todos' }[] = [
  { label: 'Todos',    value: 'todos' },
  { label: 'Pendente', value: 'pendente' },
  { label: 'Vencido',  value: 'vencido' },
  { label: 'Pago',     value: 'pago' },
];

const unidadeLabel: Record<'1' | '2', string> = { '1': 'Centro', '2': 'Bairro' };
const unidadeCor: Record<'1' | '2', string> = {
  '1': 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
  '2': 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
};

export default function BoletosPage() {
  const [filtroStatus, setFiltroStatus]     = useState<StatusBoleto | 'todos'>('todos');
  const { filtroUnidade } = useUnit();
  const [subCatSelecionada, setSubCat]      = useState('');
  const [catSelecionada, setCat]            = useState('');
  const [modalOpen, setModalOpen]           = useState(false);

  const lista = boletos.filter((b) => {
    const matchStatus  = filtroStatus === 'todos' || b.status === filtroStatus;
    const matchUnidade = filtroUnidade === 'todas' || b.unidadeId === filtroUnidade;
    return matchStatus && matchUnidade;
  });

  const vencidos     = boletos.filter((b) => b.status === 'vencido');
  const aVencer      = boletos.filter((b) => b.status === 'pendente');
  const totalPendente = boletos.filter((b) => b.status !== 'pago').reduce((a, b) => a + b.valor, 0);

  // Resolve categoria pai a partir da subcategoria selecionada
  function handleSubCat(sub: string) {
    setSubCat(sub);
    const cat = categoriasBoleto.find((c) => c.subcategorias.includes(sub));
    setCat(cat?.nome ?? '');
  }

  return (
    <>
      <Header title="Gestão de Boletos" />
      <main className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Alerta de vencidos — com unidade identificada */}
        {vencidos.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-red-700">
                {vencidos.length} boleto{vencidos.length > 1 ? 's' : ''} vencido{vencidos.length > 1 ? 's' : ''} — regularize para evitar multas
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {vencidos.map((v) => (
                <div key={v.id} className="flex items-center gap-1.5 bg-white border border-red-200 rounded-lg px-3 py-1.5">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${unidadeCor[v.unidadeId]}`}>
                    {unidadeLabel[v.unidadeId]}
                  </span>
                  <span className="text-xs text-gray-700 font-medium">{v.fornecedor}</span>
                  <span className="text-xs text-red-600 font-semibold">{formatCurrency(v.valor)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* A vencer em breve — cards com unidade em destaque */}
        {aVencer.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-amber-800">
                {aVencer.length} boleto{aVencer.length > 1 ? 's' : ''} pendente{aVencer.length > 1 ? 's' : ''} · {formatCurrency(aVencer.reduce((a, b) => a + b.valor, 0))} no total
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
              {aVencer.map((b) => (
                <div key={b.id} className="bg-white border border-amber-100 rounded-lg px-3 py-2.5 flex items-center gap-3">
                  <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg ${unidadeCor[b.unidadeId]}`}>
                    {unidadeLabel[b.unidadeId]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-900 truncate">{b.fornecedor}</p>
                    <p className="text-xs text-gray-400">{b.subCategoria} · vence {formatDate(b.vencimento)}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-800 flex-shrink-0 tabular-nums">{formatCurrency(b.valor)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Total em Aberto</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(totalPendente)}</p>
            <p className="text-xs text-gray-400 mt-1">Pendente + Vencido</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">A Vencer</p>
            <p className="text-xl font-bold text-amber-600">{aVencer.length} boletos</p>
            <p className="text-xs text-gray-400 mt-1">{formatCurrency(aVencer.reduce((a, b) => a + b.valor, 0))}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Vencidos</p>
            <p className="text-xl font-bold text-red-600">{vencidos.length} boletos</p>
            <p className="text-xs text-gray-400 mt-1">{formatCurrency(vencidos.reduce((a, b) => a + b.valor, 0))}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status */}
              {filtrosStatus.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFiltroStatus(f.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    filtroStatus === f.value
                      ? 'bg-amber-600 text-white'
                      : 'text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
              {filtroUnidade !== 'todas' && (
                <>
                  <div className="w-px h-4 bg-gray-200" />
                  <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                    <Building2 size={11} /> {filtroUnidade === '1' ? 'Centro' : 'Bairro'}
                  </span>
                </>
              )}
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg"
              style={{ backgroundColor: '#D97706' }}
            >
              <Plus size={15} /> Novo Boleto
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Fornecedor', 'Categoria', 'Sub Categoria', 'Unidade', 'Valor', 'Vencimento', 'Vínculo', 'Status'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lista.map((b) => (
                  <tr key={b.id} className={`hover:bg-gray-50 ${b.status === 'vencido' ? 'bg-red-50/40' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        {b.fornecedor}
                        {/* Badge de unidade inline no nome — visível mesmo em scroll horizontal */}
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          b.unidadeId === '1'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {unidadeLabel[b.unidadeId]}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{b.categoria}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{b.subCategoria}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${unidadeCor[b.unidadeId]}`}>
                        {unidadeLabel[b.unidadeId]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 tabular-nums">{formatCurrency(b.valor)}</td>
                    <td className={`px-4 py-3 text-sm whitespace-nowrap ${b.status === 'vencido' ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                      {formatDate(b.vencimento)}
                    </td>
                    <td className="px-4 py-3">
                      {b.vinculadoCompra && (
                        <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full ring-1 ring-purple-600/20">
                          <Link2 size={10} /> Compra
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legenda vínculo */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Link2 size={12} />
          <span>Boletos marcados com <strong className="text-purple-600">Compra</strong> estão vinculados a uma compra de insumo — não entram como despesa duplicada na DRE.</span>
        </div>
      </main>

      {/* Modal Novo Boleto */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo Boleto" size="md">
        <div className="space-y-4">
          {/* Unidade */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Unidade</label>
            <div className="grid grid-cols-2 gap-3">
              {unidadesPadaria.map((u) => (
                <button key={u.id} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-gray-200 text-sm font-medium text-gray-700 hover:border-amber-400 transition-colors">
                  <Building2 size={14} /> {u.nome}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-700">Fornecedor</label>
              <button className="text-xs text-amber-700 font-medium flex items-center gap-1"><Plus size={12} /> Cadastrar</button>
            </div>
            <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
              <option value="">Selecione…</option>
              {fornecedores.map((f) => <option key={f.id}>{f.nome}</option>)}
            </select>
          </div>

          {/* Subcategoria → resolve categoria pai automaticamente */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Subcategoria</label>
            <select
              value={subCatSelecionada}
              onChange={(e) => handleSubCat(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="">Selecione a subcategoria…</option>
              {categoriasBoleto.map((cat) => (
                <optgroup key={cat.id} label={cat.nome}>
                  {cat.subcategorias.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {catSelecionada && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <span className="text-xs text-blue-600">Categoria principal resolvida automaticamente:</span>
              <span className="text-xs font-bold text-blue-800">{catSelecionada}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Valor (R$)</label>
              <input type="number" placeholder="0,00" min={0} step="0.01" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Vencimento</label>
              <input type="date" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Status</label>
            <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
              <option value="vencido">Vencido</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="vinculado" className="w-4 h-4 accent-amber-600" />
            <label htmlFor="vinculado" className="text-xs text-gray-700 flex items-center gap-1">
              <Link2 size={12} className="text-purple-600" />
              Vincular a uma compra de insumo (não duplica na DRE)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={() => setModalOpen(false)} className="px-5 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#D97706' }}>Salvar Boleto</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
