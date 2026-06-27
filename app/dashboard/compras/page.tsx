'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Search, Building2, X, Package, Truck, ChevronRight, Link2, FileText, Pencil, Download } from 'lucide-react';
import { useUnit } from '@/contexts/UnitContext';
import { useDateRange } from '@/contexts/DateRangeContext';
import { createClient } from '@/lib/supabase/client';
import { exportToXlsx } from '@/lib/exportXlsx';

const CORES_BG_BADGE = [
  'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
  'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
  'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
  'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20',
  'bg-red-50 text-red-700 ring-1 ring-red-600/20',
];

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const CATEGORIAS_COMPRA_FALLBACK = ['Mercearia','Laticínios','Carnes','Bebidas','Confeitaria','Embalagens','Ovos / Aves','Biscoitos'];
const UNIDADES_MEDIDA   = ['KG','L','UN','DZ','CX','PC','MACO'];

type ResultItem =
  | { tipo: 'combo';      prodNome: string; fornNome: string; cat: string; un: string }
  | { tipo: 'fornecedor'; fornNome: string; cat: string };

function ProdutoAutocomplete({
  comprasDB, produtosDB, fornecedoresDB, onSelect, produtosExtras, onAddProduto, categorias,
}: {
  comprasDB: any[]; produtosDB: any[]; fornecedoresDB: any[];
  onSelect: (prod: string, forn: string, un: string) => void;
  produtosExtras: { nome: string; unidade: string; cat: string }[];
  onAddProduto: (nome: string, unidade: string, cat: string) => void;
  categorias: string[];
}) {
  const [query, setQuery]             = useState('');
  const [aberto, setAberto]           = useState(false);
  const [selecionado, setSelecionado] = useState<{ prod: string; forn: string } | null>(null);
  const [novoMode, setNovoMode]       = useState(false);
  const [novoProdNome, setNovoProdNome]   = useState('');
  const [novaUnMedida, setNovaUnMedida]   = useState('KG');
  const [novaCategoria, setNovaCategoria] = useState('Mercearia');
  const inputRef     = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, []);

  const resultados: ResultItem[] = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const results: ResultItem[] = [];
    const seen = new Set<string>();
    for (const c of comprasDB) {
      const key = `${c.produto}||${c.fornecedor}`;
      if (!seen.has(key) && (c.produto.toLowerCase().includes(q) || c.fornecedor.toLowerCase().includes(q))) {
        seen.add(key);
        results.push({ tipo: 'combo', prodNome: c.produto, fornNome: c.fornecedor, cat: c.categoria, un: c.unidade });
      }
    }
    const todosProdutos = [
      ...produtosDB,
      ...produtosExtras.map((p, i) => ({ id: `extra-${i}`, nome: p.nome, unidade: p.unidade, categoria: p.cat })),
    ];
    for (const p of todosProdutos) {
      if (p.nome.toLowerCase().includes(q) && !results.some(r => r.tipo === 'combo' && r.prodNome === p.nome))
        results.push({ tipo: 'combo', prodNome: p.nome, fornNome: '', cat: p.categoria, un: p.unidade });
    }
    for (const f of fornecedoresDB) {
      if (f.nome.toLowerCase().includes(q) && !results.some(r => r.tipo === 'combo' && r.fornNome === f.nome))
        results.push({ tipo: 'fornecedor', fornNome: f.nome, cat: f.categoria });
    }
    return results.slice(0, 10);
  }, [query, comprasDB, produtosDB, fornecedoresDB, produtosExtras]);

  function handleSelect(r: ResultItem) {
    const prod = r.tipo === 'combo' ? r.prodNome : query;
    const forn = r.tipo === 'combo' ? r.fornNome : r.fornNome;
    const un   = r.tipo === 'combo' ? r.un : '';
    setSelecionado({ prod, forn });
    setAberto(false);
    setQuery('');
    onSelect(prod, forn, un);
  }

  function handleClear() {
    setSelecionado(null);
    setQuery('');
    onSelect('', '', '');
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleAddProduto() {
    if (!novoProdNome.trim()) return;
    onAddProduto(novoProdNome.trim(), novaUnMedida, novaCategoria);
    setSelecionado({ prod: novoProdNome.trim(), forn: '' });
    onSelect(novoProdNome.trim(), '', novaUnMedida);
    setNovoMode(false);
    setAberto(false);
    setQuery('');
    setNovoProdNome('');
  }

  if (selecionado) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg px-3 py-2 text-sm font-medium">
          <Package size={14} />
          {selecionado.prod}
          {selecionado.forn && (
            <span className="text-xs text-amber-600 font-normal flex items-center gap-1">
              <ChevronRight size={10} />{selecionado.forn}
            </span>
          )}
          <button onClick={handleClear} className="ml-1 text-amber-400 hover:text-amber-700"><X size={12} /></button>
        </span>
        <span className="text-xs text-gray-400">Clique no × para trocar</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input ref={inputRef} type="text" placeholder="Digite o produto ou fornecedor…"
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
                    <button onClick={e => { e.stopPropagation(); handleSelect(r); }}
                      className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-amber-50 text-left transition-colors">
                      {r.tipo === 'combo' ? <Package size={14} className="text-amber-600 mt-0.5 flex-shrink-0" /> : <Truck size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{r.tipo === 'combo' ? r.prodNome : r.fornNome}</p>
                        <p className="text-xs text-gray-400">{r.tipo === 'combo' ? (r.fornNome ? `Fornecedor: ${r.fornNome}` : `Categoria: ${r.cat}`) : `Fornecedor · ${r.cat}`}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="border-t border-gray-100 px-4 py-2">
                <button onClick={e => { e.stopPropagation(); setNovoMode(true); setAberto(false); setNovoProdNome(query); }}
                  className="text-xs text-amber-700 font-medium flex items-center gap-1 hover:text-amber-900">
                  <Plus size={12} /> Cadastrar novo produto/insumo
                </button>
              </div>
            </>
          ) : (
            <div className="p-4">
              <p className="text-sm text-gray-500 mb-3">Nenhum resultado para <strong>"{query}"</strong></p>
              <button onClick={e => { e.stopPropagation(); setNovoMode(true); setAberto(false); setNovoProdNome(query); }}
                className="flex items-center gap-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-lg transition-colors">
                <Plus size={14} /> Cadastrar novo produto/insumo
              </button>
            </div>
          )}
        </div>
      )}
      {novoMode && (
        <div className="mt-2 p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-amber-900 flex items-center gap-2"><Package size={14} /> Cadastrar novo produto / insumo</p>
            <button onClick={() => setNovoMode(false)} className="text-amber-400 hover:text-amber-700"><X size={14} /></button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Nome do produto *</label>
              <input type="text" placeholder="Ex: Farinha de Trigo" value={novoProdNome}
                onChange={e => setNovoProdNome(e.target.value)} autoFocus
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Unidade</label>
              <select value={novaUnMedida} onChange={e => setNovaUnMedida(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                {UNIDADES_MEDIDA.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Categoria</label>
              <select value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                {categorias.map((c: string) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button onClick={handleAddProduto} disabled={!novoProdNome.trim()}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50" style={{ backgroundColor: '#D97706' }}>
              Cadastrar e selecionar
            </button>
            <button onClick={() => setNovoMode(false)} className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComprasPage() {
  const [listaCompras, setListaCompras]   = useState<any[]>([]);
  const [produtosDB, setProdutosDB]       = useState<any[]>([]);
  const [fornecedoresDB, setFornecedoresDB] = useState<any[]>([]);
  const [categoriasDB, setCategoriasDB]   = useState<string[]>([]);
  const [carregando, setCarregando]       = useState(true);
  const [salvando, setSalvando]           = useState(false);
  const [erro, setErro]                   = useState('');
  const [modalOpen, setModalOpen]         = useState(false);
  const [busca, setBusca]                 = useState('');
  const [produtosExtras, setProdutosExtras] = useState<{ nome: string; unidade: string; cat: string }[]>([]);
  const [formUnidade, setFormUnidade]     = useState('1');
  const [formData, setFormData]           = useState(new Date().toISOString().split('T')[0]);
  const [formCategoria, setFormCategoria] = useState('Mercearia');
  const [formProd, setFormProd]           = useState('');
  const [formForn, setFormForn]           = useState('');
  const [formUnMedida, setFormUnMedida]   = useState('KG');
  const [formQtd, setFormQtd]             = useState('');
  const [formVlrUnit, setFormVlrUnit]     = useState('');
  const [valorTotal, setValorTotal]       = useState('');
  const [gerarBoleto, setGerarBoleto]     = useState(false);
  const [vencimentoBoleto, setVencimentoBoleto] = useState('');
  const [editandoCompra, setEditandoCompra] = useState<any>(null);
  const [salvandoEdit, setSalvandoEdit]     = useState(false);
  const [erroEdit, setErroEdit]             = useState('');
  const [expOpen, setExpOpen]               = useState(false);
  const [expUnit, setExpUnit]               = useState('todas');
  const { filtroUnidade, unidades }       = useUnit();
  const { mesInicio, mesFim, ano }        = useDateRange();

  const periodoLabel = mesInicio === mesFim
    ? `${MESES[mesInicio]} ${ano}`
    : `${MESES[mesInicio]}–${MESES[mesFim]} ${ano}`;

  const inRange = (dataStr: string) => {
    const [y, m] = (dataStr as string).split('-').map(Number);
    return y === ano && (m - 1) >= mesInicio && (m - 1) <= mesFim;
  };

  const CATEGORIAS_COMPRA = categoriasDB.length > 0 ? categoriasDB : CATEGORIAS_COMPRA_FALLBACK;

  async function carregarDados() {
    const supabase = createClient();
    const [{ data: comprasData }, { data: prodData }, { data: fornData }, { data: catData }] = await Promise.all([
      supabase.from('compras').select('*').order('data', { ascending: false }),
      supabase.from('produtos').select('*').order('nome'),
      supabase.from('fornecedores').select('*').order('nome'),
      supabase.from('categorias_compra').select('nome').order('nome'),
    ]);
    setListaCompras(comprasData || []);
    setProdutosDB(prodData || []);
    setFornecedoresDB(fornData || []);
    setCategoriasDB((catData || []).map((c: any) => c.nome as string).filter(Boolean));
    setCarregando(false);
  }

  useEffect(() => { carregarDados(); }, []);

  function handleExportCompras() {
    const unidNome = (uid: string) => unidades.find(u => u.id === uid)?.nome ?? uid;
    const rows = listaCompras
      .filter(c => (expUnit === 'todas' || c.unidade_id === expUnit) && c.data && inRange(c.data))
      .sort((a, b) => a.data.localeCompare(b.data))
      .map(c => ({
        'Data':           c.data ?? '',
        'Produto':        c.produto ?? '',
        'Fornecedor':     c.fornecedor ?? '',
        'Categoria':      c.categoria ?? '',
        'Unidade':        unidNome(c.unidade_id),
        'Qtd':            c.quantidade ?? '',
        'Un. Medida':     c.unidade ?? '',
        'Valor Unit. (R$)': Number(c.valor_unitario) || 0,
        'Total (R$)':     Number(c.valor_total) || 0,
      }));
    const label = expUnit === 'todas' ? 'Todas' : (unidades.find(u => u.id === expUnit)?.nome ?? expUnit);
    exportToXlsx(rows, `compras_${label}_${periodoLabel.replace(/[–\s]/g, '_')}`);
    setExpOpen(false);
  }

  const lista = listaCompras.filter(c => {
    const matchUnidade = filtroUnidade === 'todas' || c.unidade_id === filtroUnidade;
    const matchBusca = (c.produto || '').toLowerCase().includes(busca.toLowerCase()) ||
                       (c.fornecedor || '').toLowerCase().includes(busca.toLowerCase());
    const matchData = c.data ? inRange(c.data) : true;
    return matchUnidade && matchBusca && matchData;
  });

  const totalFiltrado = lista.reduce((acc, c) => acc + Number(c.valor_total), 0);

  const totalPorUnidade = useMemo(() =>
    unidades.map((u, i) => ({
      id: u.id,
      nome: u.nome,
      cor: CORES_BG_BADGE[i % CORES_BG_BADGE.length],
      total: listaCompras
        .filter(c => c.unidade_id === u.id && c.data && inRange(c.data))
        .reduce((a, c) => a + Number(c.valor_total), 0),
      count: listaCompras.filter(c => c.unidade_id === u.id && c.data && inRange(c.data)).length,
    })),
  [listaCompras, unidades, mesInicio, mesFim, ano]);

  function handleOpenModal() {
    setFormProd(''); setFormForn(''); setFormUnMedida('KG');
    setFormQtd(''); setFormVlrUnit(''); setValorTotal('');
    setGerarBoleto(false); setVencimentoBoleto('');
    setErro(''); setModalOpen(true);
  }

  // Calcula total automaticamente quando qtd e vlr unit mudam
  useEffect(() => {
    const qtd = parseFloat(formQtd);
    const unit = parseFloat(formVlrUnit);
    if (qtd > 0 && unit > 0) setValorTotal((qtd * unit).toFixed(2));
  }, [formQtd, formVlrUnit]);

  async function handleSalvar() {
    if (!formProd) { setErro('Selecione um produto.'); return; }
    if (!valorTotal || parseFloat(valorTotal) <= 0) { setErro('Informe o valor total.'); return; }
    setSalvando(true);
    setErro('');
    const supabase = createClient();
    const novaCompra = {
      id: `c-${Date.now()}`,
      unidade_id: formUnidade,
      data: formData,
      produto: formProd,
      fornecedor: formForn || '-',
      categoria: formCategoria,
      quantidade: parseFloat(formQtd) || null,
      unidade: formUnMedida,
      valor_unitario: parseFloat(formVlrUnit) || null,
      valor_total: parseFloat(valorTotal),
    };
    const { error } = await supabase.from('compras').insert(novaCompra);
    if (error) { setErro('Erro ao salvar: ' + error.message); setSalvando(false); return; }

    if (gerarBoleto && vencimentoBoleto) {
      await supabase.from('boletos').insert({
        id: `b-${Date.now()}`,
        unidade_id: formUnidade,
        fornecedor: formForn || formProd,
        categoria: 'Compra de Insumos',
        sub_categoria: formCategoria,
        valor: parseFloat(valorTotal),
        vencimento: vencimentoBoleto,
        status: 'pendente',
        vinculado_compra: true,
      });
    }

    await carregarDados();
    setSalvando(false);
    setModalOpen(false);
  }

  function handleOpenEditCompra(compra: any) {
    setEditandoCompra(compra);
    setFormUnidade(compra.unidade_id || '1');
    setFormData(compra.data || new Date().toISOString().split('T')[0]);
    setFormCategoria(compra.categoria || 'Mercearia');
    setFormProd(compra.produto || '');
    setFormForn(compra.fornecedor || '');
    setFormUnMedida(compra.unidade || 'KG');
    setFormQtd(compra.quantidade != null ? String(compra.quantidade) : '');
    setFormVlrUnit(compra.valor_unitario != null ? String(compra.valor_unitario) : '');
    setValorTotal(compra.valor_total != null ? String(compra.valor_total) : '');
    setErroEdit('');
  }

  async function handleSalvarEditCompra() {
    if (!editandoCompra) return;
    if (!formProd.trim()) { setErroEdit('Informe o produto.'); return; }
    if (!valorTotal || parseFloat(valorTotal) <= 0) { setErroEdit('Informe o valor total.'); return; }
    setSalvandoEdit(true);
    setErroEdit('');
    const supabase = createClient();
    const { error } = await supabase.from('compras').update({
      unidade_id: formUnidade,
      data: formData,
      produto: formProd.trim(),
      fornecedor: formForn.trim() || '-',
      categoria: formCategoria,
      quantidade: parseFloat(formQtd) || null,
      unidade: formUnMedida,
      valor_unitario: parseFloat(formVlrUnit) || null,
      valor_total: parseFloat(valorTotal),
    }).eq('id', editandoCompra.id);
    if (error) { setErroEdit('Erro ao salvar: ' + error.message); setSalvandoEdit(false); return; }
    await carregarDados();
    setSalvandoEdit(false);
    setEditandoCompra(null);
  }

  return (
    <>
      <Header title="Gestão de Compras" />
      <main className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className={`grid grid-cols-1 gap-4 ${totalPorUnidade.length <= 2 ? 'sm:grid-cols-3' : 'sm:grid-cols-2 xl:grid-cols-4'}`}>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Total — {periodoLabel}</p>
            <p className="text-[1.625rem] leading-none font-display italic text-gray-900">{formatCurrency(totalPorUnidade.reduce((a, u) => a + u.total, 0))}</p>
            <p className="text-xs text-gray-400 mt-1">{totalPorUnidade.reduce((a, u) => a + u.count, 0)} lançamentos no período</p>
          </div>
          {totalPorUnidade.map(u => (
            <div key={u.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${u.cor}`}>{u.nome}</span>
              </div>
              <p className="text-[1.625rem] leading-none font-display italic text-gray-900">{formatCurrency(u.total)}</p>
              <p className="text-xs text-gray-400 mt-1">{u.count} compras no período</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="relative min-w-48 max-w-xs">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Buscar produto ou fornecedor…" value={busca}
                  onChange={e => setBusca(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              {filtroUnidade !== 'todas' && (
                <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                  <Building2 size={12} /> {unidades.find(u => u.id === filtroUnidade)?.nome ?? filtroUnidade}
                </span>
              )}
            </div>
            <button onClick={() => { setExpUnit(filtroUnidade); setExpOpen(true); }}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50">
              <Download size={15} /> Baixar .xlsx
            </button>
            <button onClick={handleOpenModal} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#D97706' }}>
              <Plus size={15} /> Nova Compra
            </button>
          </div>

          {carregando ? (
            <div className="py-16 text-center text-gray-400 text-sm">Carregando…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Data','Produto','Fornecedor','Categoria','Unidade','Qtd / Un','Valor Unit.','Total',''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lista.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(c.data)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{c.produto}</td>
                      <td className="px-4 py-3 text-gray-600">{c.fornecedor}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-600/20">{c.categoria}</span>
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const idx = unidades.findIndex(u => u.id === c.unidade_id);
                          return (
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CORES_BG_BADGE[idx >= 0 ? idx % CORES_BG_BADGE.length : 0]}`}>
                              {unidades[idx]?.nome ?? c.unidade_id}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{c.quantidade} {c.unidade}</td>
                      <td className="px-4 py-3 text-gray-600 text-right tabular-nums">{c.valor_unitario ? formatCurrency(c.valor_unitario) : '—'}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900 text-right tabular-nums">{formatCurrency(c.valor_total)}</td>
                      <td className="px-3 py-3">
                        <button onClick={() => handleOpenEditCompra(c)}
                          className="p-1.5 text-gray-300 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Editar">
                          <Pencil size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {lista.length === 0 && (
                    <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400 text-sm">Nenhuma compra encontrada.</td></tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-amber-50">
                    <td colSpan={7} className="px-4 py-3 text-sm font-semibold text-gray-900">Total filtrado</td>
                    <td className="px-4 py-3 text-sm font-bold text-amber-800 text-right tabular-nums">{formatCurrency(totalFiltrado)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </main>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova Compra" size="lg">
        <div className="space-y-4">
          {/* Unidade */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Unidade</label>
            <div className="grid grid-cols-2 gap-3">
              {unidades.map(u => (
                <button key={u.id} onClick={() => setFormUnidade(u.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${formUnidade === u.id ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-gray-200 text-gray-700 hover:border-amber-300'}`}>
                  <Building2 size={14} /> {u.nome}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Data</label>
              <input type="date" value={formData} onChange={e => setFormData(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Categoria</label>
              <select value={formCategoria} onChange={e => setFormCategoria(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                {CATEGORIAS_COMPRA.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Produto / Fornecedor</label>
            <ProdutoAutocomplete key={modalOpen ? 'open' : 'closed'}
              comprasDB={listaCompras} produtosDB={produtosDB} fornecedoresDB={fornecedoresDB}
              produtosExtras={produtosExtras} categorias={CATEGORIAS_COMPRA}
              onSelect={(prod, forn, un) => { setFormProd(prod); setFormForn(forn); if (un) setFormUnMedida(un); }}
              onAddProduto={async (nome, unidade, cat) => {
                setProdutosExtras(prev => [...prev, { nome, unidade, cat }]);
                const supabase = createClient();
                await supabase.from('produtos').insert({ id: `prod-${Date.now()}`, nome, unidade, categoria: cat, ativo: true });
                const { data } = await supabase.from('produtos').select('*').order('nome');
                if (data) setProdutosDB(data);
              }}
            />
            {formForn && (
              <p className="mt-1.5 text-xs text-gray-400 flex items-center gap-1">
                <Truck size={11} /> Fornecedor: <strong className="text-gray-600">{formForn}</strong>
              </p>
            )}
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Quantidade</label>
              <input type="number" placeholder="0" min={0} step="0.01" value={formQtd}
                onChange={e => setFormQtd(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Un. Medida</label>
              <select value={formUnMedida} onChange={e => setFormUnMedida(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                {UNIDADES_MEDIDA.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Valor Unit. (R$)</label>
              <input type="number" placeholder="0,00" min={0} step="0.01" value={formVlrUnit}
                onChange={e => setFormVlrUnit(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Total (R$)</label>
              <input type="number" placeholder="0,00" value={valorTotal}
                onChange={e => setValorTotal(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <button type="button" onClick={() => setGerarBoleto(!gerarBoleto)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${gerarBoleto ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}>
              <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FileText size={15} className={gerarBoleto ? 'text-purple-600' : 'text-gray-400'} />
                Gerar boleto automaticamente para esta compra
              </span>
              <div className={`w-8 h-4 rounded-full transition-colors relative ${gerarBoleto ? 'bg-purple-500' : 'bg-gray-300'}`}>
                <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform shadow ${gerarBoleto ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </button>
            {gerarBoleto && (
              <div className="mt-3 p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-3">
                <p className="text-xs font-semibold text-purple-900 flex items-center gap-1.5"><Link2 size={13} /> Boleto vinculado</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Fornecedor</label>
                    <input type="text" value={formForn || '—'} readOnly
                      className="w-full px-3 py-2 text-sm border border-purple-200 rounded-lg bg-white text-gray-600 cursor-default" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Vencimento *</label>
                    <input type="date" value={vencimentoBoleto} onChange={e => setVencimentoBoleto(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={handleSalvar} disabled={salvando}
              className="px-5 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: gerarBoleto ? '#7C3AED' : '#D97706' }}>
              {gerarBoleto && <FileText size={14} />}
              {salvando ? 'Salvando…' : gerarBoleto ? 'Salvar e Gerar Boleto' : 'Salvar Compra'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de edição de compra */}
      <Modal open={editandoCompra !== null} onClose={() => setEditandoCompra(null)} title="Editar Compra" size="lg">
        {editandoCompra && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Unidade</label>
              <div className="grid grid-cols-2 gap-3">
                {unidades.map(u => (
                  <button key={u.id} onClick={() => setFormUnidade(u.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${formUnidade === u.id ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-gray-200 text-gray-700 hover:border-amber-300'}`}>
                    <Building2 size={14} /> {u.nome}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Data</label>
                <input type="date" value={formData} onChange={e => setFormData(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Categoria</label>
                <select value={formCategoria} onChange={e => setFormCategoria(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                  {CATEGORIAS_COMPRA.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Produto *</label>
                <input autoFocus type="text" value={formProd} onChange={e => setFormProd(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Fornecedor</label>
                <input type="text" value={formForn} onChange={e => setFormForn(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Quantidade</label>
                <input type="number" placeholder="0" min={0} step="0.01" value={formQtd}
                  onChange={e => setFormQtd(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Un. Medida</label>
                <select value={formUnMedida} onChange={e => setFormUnMedida(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                  {UNIDADES_MEDIDA.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Valor Unit. (R$)</label>
                <input type="number" placeholder="0,00" min={0} step="0.01" value={formVlrUnit}
                  onChange={e => setFormVlrUnit(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Total (R$) *</label>
                <input type="number" placeholder="0,00" value={valorTotal}
                  onChange={e => setValorTotal(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
            </div>

            {erroEdit && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erroEdit}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEditandoCompra(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSalvarEditCompra} disabled={salvandoEdit}
                className="px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60" style={{ backgroundColor: '#D97706' }}>
                {salvandoEdit ? 'Salvando…' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal exportar compras */}
      <Modal open={expOpen} onClose={() => setExpOpen(false)} title="Exportar Compras (.xlsx)" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Unidade</label>
            <select value={expUnit} onChange={e => setExpUnit(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
              <option value="todas">Todas as unidades</option>
              {unidades.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
            </select>
          </div>
          <p className="text-xs text-gray-400">Período: {periodoLabel} · Respeita os filtros de data.</p>
          <div className="flex justify-end gap-3 pt-1">
            <button onClick={() => setExpOpen(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={handleExportCompras}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#D97706' }}>
              <Download size={14} /> Baixar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
