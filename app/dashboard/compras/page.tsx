'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import { compras, produtos, fornecedores, categoriasCompra, unidades, unidadesPadaria } from '@/lib/mock-data';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Search, Building2, X, Package, Truck, ChevronRight } from 'lucide-react';
import { useUnit } from '@/contexts/UnitContext';
import type { Compra } from '@/types';

const unidadeLabel: Record<'1' | '2', string> = { '1': 'Centro', '2': 'Bairro' };
const unidadeCor: Record<'1' | '2', string> = {
  '1': 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
  '2': 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
};

type ResultItem =
  | { tipo: 'combo';      prodNome: string; fornNome: string; cat: string; un: string }
  | { tipo: 'fornecedor'; fornNome: string; cat: string };

// ── Autocomplete ──────────────────────────────────────────────
function ProdutoAutocomplete({
  onSelect,
  fornExtras,
  onAddFornecedor,
}: {
  onSelect: (prod: string, forn: string) => void;
  fornExtras: { nome: string; cat: string }[];
  onAddFornecedor: (nome: string, cat: string) => void;
}) {
  const [query, setQuery]               = useState('');
  const [aberto, setAberto]             = useState(false);
  const [selecionado, setSelecionado]   = useState<{ prod: string; forn: string } | null>(null);
  const [novoMode, setNovoMode]         = useState(false);
  const [novoNome, setNovoNome]         = useState('');
  const [novoCat, setNovoCat]           = useState('Mercearia');
  const inputRef                        = useRef<HTMLInputElement>(null);
  const containerRef                    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false);
        // novoMode só fecha via botão X explícito
      }
    }
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const resultados: ResultItem[] = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const results: ResultItem[] = [];
    const seen = new Set<string>();

    // Combos produto+fornecedor já usados em compras
    for (const c of compras) {
      const key = `${c.produto}||${c.fornecedor}`;
      if (!seen.has(key) && (c.produto.toLowerCase().includes(q) || c.fornecedor.toLowerCase().includes(q))) {
        seen.add(key);
        results.push({ tipo: 'combo', prodNome: c.produto, fornNome: c.fornecedor, cat: c.categoria, un: c.unidade });
      }
    }

    // Produtos cadastrados sem histórico de compra
    for (const p of produtos) {
      if (p.nome.toLowerCase().includes(q) && !results.some(r => r.tipo === 'combo' && r.prodNome === p.nome)) {
        results.push({ tipo: 'combo', prodNome: p.nome, fornNome: '', cat: p.categoria, un: p.unidade });
      }
    }

    // Fornecedores que não aparecem como produtos acima
    const todosForns = [
      ...fornecedores.map(f => ({ nome: f.nome, cat: f.categoria })),
      ...fornExtras,
    ];
    for (const f of todosForns) {
      if (f.nome.toLowerCase().includes(q) && !results.some(r => r.tipo === 'combo' && r.fornNome === f.nome)) {
        results.push({ tipo: 'fornecedor', fornNome: f.nome, cat: f.cat });
      }
    }

    return results.slice(0, 10);
  }, [query, fornExtras]);

  function handleSelect(r: ResultItem) {
    const prod = r.tipo === 'combo' ? r.prodNome : query;
    const forn = r.tipo === 'combo' ? r.fornNome : r.fornNome;
    setSelecionado({ prod, forn });
    setAberto(false);
    setQuery('');
    onSelect(prod, forn);
  }

  function handleClear() {
    setSelecionado(null);
    setQuery('');
    onSelect('', '');
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleAddFornecedor() {
    if (!novoNome.trim()) return;
    onAddFornecedor(novoNome.trim(), novoCat);
    setSelecionado({ prod: query || novoNome.trim(), forn: novoNome.trim() });
    onSelect(query || novoNome.trim(), novoNome.trim());
    setNovoMode(false);
    setAberto(false);
    setQuery('');
    setNovoNome('');
  }

  if (selecionado) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg px-3 py-2 text-sm font-medium">
          <Package size={14} />
          {selecionado.prod}
          {selecionado.forn && (
            <span className="text-xs text-amber-600 font-normal flex items-center gap-1">
              <ChevronRight size={10} />
              {selecionado.forn}
            </span>
          )}
          <button onClick={handleClear} className="ml-1 text-amber-400 hover:text-amber-700 transition-colors">
            <X size={12} />
          </button>
        </span>
        <span className="text-xs text-gray-400">Clique no × para trocar</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Digite o produto ou nome do fornecedor…"
          value={query}
          onChange={e => { setQuery(e.target.value); setAberto(true); setNovoMode(false); }}
          onFocus={() => query && setAberto(true)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {aberto && query.trim() && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          {resultados.length > 0 ? (
            <>
              <ul className="py-1 max-h-52 overflow-y-auto">
                {resultados.map((r, i) => (
                  <li key={i}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSelect(r); }}
                      className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-amber-50 text-left transition-colors"
                    >
                      {r.tipo === 'combo'
                        ? <Package size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                        : <Truck    size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {r.tipo === 'combo' ? r.prodNome : r.fornNome}
                        </p>
                        <p className="text-xs text-gray-400">
                          {r.tipo === 'combo'
                            ? r.fornNome ? `Fornecedor: ${r.fornNome}` : `Categoria: ${r.cat}`
                            : `Fornecedor · ${r.cat}`}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="border-t border-gray-100 px-4 py-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setNovoMode(true); setAberto(false); }}
                  className="text-xs text-amber-700 font-medium flex items-center gap-1 hover:text-amber-900"
                >
                  <Plus size={12} /> Adicionar novo fornecedor
                </button>
              </div>
            </>
          ) : (
            <div className="p-4">
              <p className="text-sm text-gray-500 mb-3">Nenhum resultado para <strong>"{query}"</strong></p>
              <button
                onClick={(e) => { e.stopPropagation(); setNovoMode(true); setAberto(false); setNovoNome(query); }}
                className="flex items-center gap-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-lg transition-colors"
              >
                <Plus size={14} /> Adicionar novo fornecedor
              </button>
            </div>
          )}
        </div>
      )}

      {/* Painel inline de cadastro de fornecedor */}
      {novoMode && (
        <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-blue-900">Cadastrar novo fornecedor</p>
            <button onClick={() => setNovoMode(false)} className="text-blue-400 hover:text-blue-700">
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-blue-800 mb-1">Nome do fornecedor *</label>
              <input
                type="text"
                placeholder="Ex: Padaria Ingredientes Ltda"
                value={novoNome}
                onChange={e => setNovoNome(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-blue-800 mb-1">Categoria</label>
              <select
                value={novoCat}
                onChange={e => setNovoCat(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              >
                {categoriasCompra.map(c => <option key={c.id}>{c.nome}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleAddFornecedor}
              disabled={!novoNome.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-lg transition-colors"
            >
              Cadastrar e selecionar
            </button>
            <button onClick={() => setNovoMode(false)} className="px-3 py-2 text-sm text-blue-600 hover:text-blue-900">
              Cancelar
            </button>
            <p className="text-xs text-blue-600 ml-auto">O campo será preenchido automaticamente</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function ComprasPage() {
  const [modalOpen, setModalOpen]     = useState(false);
  const [busca, setBusca]             = useState('');
  const [fornExtras, setFornExtras]   = useState<{ nome: string; cat: string }[]>([]);
  const [formProd, setFormProd]       = useState('');
  const [formForn, setFormForn]       = useState('');
  const { filtroUnidade }             = useUnit();

  const lista: Compra[] = compras.filter((c) => {
    const matchUnidade = filtroUnidade === 'todas' || c.unidadeId === filtroUnidade;
    const matchBusca =
      c.produto.toLowerCase().includes(busca.toLowerCase()) ||
      c.fornecedor.toLowerCase().includes(busca.toLowerCase());
    return matchUnidade && matchBusca;
  });

  const totalMes = lista.reduce((acc, c) => acc + c.valorTotal, 0);
  const totalU1  = compras.filter((c) => c.unidadeId === '1').reduce((a, c) => a + c.valorTotal, 0);
  const totalU2  = compras.filter((c) => c.unidadeId === '2').reduce((a, c) => a + c.valorTotal, 0);

  function handleOpenModal() {
    setFormProd('');
    setFormForn('');
    setModalOpen(true);
  }

  return (
    <>
      <Header title="Gestão de Compras" />
      <main className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Total de Compras — Jun</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalU1 + totalU2)}</p>
            <p className="text-xs text-gray-400 mt-1">{compras.length} lançamentos</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <p className="text-xs text-gray-500">Unidade Centro</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalU1)}</p>
            <p className="text-xs text-gray-400 mt-1">{compras.filter((c) => c.unidadeId === '1').length} compras</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <p className="text-xs text-gray-500">Unidade Bairro</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalU2)}</p>
            <p className="text-xs text-gray-400 mt-1">{compras.filter((c) => c.unidadeId === '2').length} compras</p>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="relative min-w-48 max-w-xs">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar produto ou fornecedor…"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              {filtroUnidade !== 'todas' && (
                <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                  <Building2 size={12} /> {filtroUnidade === '1' ? 'Centro' : 'Bairro'}
                </span>
              )}
            </div>
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg"
              style={{ backgroundColor: '#D97706' }}
            >
              <Plus size={15} /> Nova Compra
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Data', 'Produto', 'Fornecedor', 'Categoria', 'Unidade', 'Qtd / Un', 'Valor Unit.', 'Total'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lista.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(c.data)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{c.produto}</td>
                    <td className="px-4 py-3 text-gray-600">{c.fornecedor}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-600/20">
                        {c.categoria}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${unidadeCor[c.unidadeId]}`}>
                        {unidadeLabel[c.unidadeId]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{c.quantidade} {c.unidade}</td>
                    <td className="px-4 py-3 text-gray-600 text-right tabular-nums">{formatCurrency(c.valorUnitario)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 text-right tabular-nums">{formatCurrency(c.valorTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-amber-50">
                  <td colSpan={7} className="px-4 py-3 text-sm font-semibold text-gray-900">Total filtrado</td>
                  <td className="px-4 py-3 text-sm font-bold text-amber-800 text-right tabular-nums">
                    {formatCurrency(totalMes)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </main>

      {/* Modal Nova Compra */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova Compra" size="lg">
        <div className="space-y-4">

          {/* Unidade */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Unidade</label>
            <div className="grid grid-cols-2 gap-3">
              {unidadesPadaria.map((u) => (
                <button
                  key={u.id}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-gray-200 text-sm font-medium text-gray-700 hover:border-amber-400 transition-colors"
                >
                  <Building2 size={14} /> {u.nome}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Data</label>
              <input type="date" defaultValue="2026-06-18" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Categoria</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                {categoriasCompra.map((c) => <option key={c.id}>{c.nome}</option>)}
              </select>
            </div>
          </div>

          {/* Campo de autocomplete — produto + fornecedor */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Produto / Fornecedor</label>
            <ProdutoAutocomplete
              key={modalOpen ? 'open' : 'closed'}
              fornExtras={fornExtras}
              onSelect={(prod, forn) => { setFormProd(prod); setFormForn(forn); }}
              onAddFornecedor={(nome, cat) => setFornExtras(prev => [...prev, { nome, cat }])}
            />
            {formForn && (
              <p className="mt-1.5 text-xs text-gray-400 flex items-center gap-1">
                <Truck size={11} /> Fornecedor selecionado: <strong className="text-gray-600">{formForn}</strong>
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Quantidade</label>
              <input type="number" placeholder="0" min={0} step="0.01" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Valor Unit. (R$)</label>
              <input type="number" placeholder="0,00" min={0} step="0.01" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Total (R$)</label>
              <input type="number" placeholder="0,00" readOnly className="w-full px-3 py-2 text-sm border border-gray-100 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={() => setModalOpen(false)} className="px-5 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#D97706' }}>Salvar Compra</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
