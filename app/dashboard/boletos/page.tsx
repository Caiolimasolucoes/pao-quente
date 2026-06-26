'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, AlertCircle, Link2, Building2, Search, X, Truck, CheckCircle2, Pencil } from 'lucide-react';
import { useUnit } from '@/contexts/UnitContext';
import { useDateRange } from '@/contexts/DateRangeContext';
import { createClient } from '@/lib/supabase/client';

const CATEGORIAS_BOLETO_FALLBACK = [
  { nome: 'Insumos',        subs: ['Mercearia','Laticínios','Carnes','Bebidas','Confeitaria','Embalagens'] },
  { nome: 'Pessoal',        subs: ['Folha de Pagamento','Pró Labore','Retira Sócio'] },
  { nome: 'Encargos',       subs: ['Simples Nacional','FGTS','INSS'] },
  { nome: 'Infraestrutura', subs: ['Aluguel','Energia','Água','Internet','Manutenção'] },
  { nome: 'Outros',         subs: ['Despesas ADM','Investimento','Outros'] },
];

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const CORES_BG_BADGE = [
  'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
  'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
  'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
  'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20',
  'bg-red-50 text-red-700 ring-1 ring-red-600/20',
];

const HOJE = new Date().toISOString().split('T')[0];

function calcStatus(b: any): 'pago' | 'pendente' | 'vencido' {
  if (b.status === 'pago') return 'pago';
  return b.vencimento && b.vencimento < HOJE ? 'vencido' : 'pendente';
}

function FornecedorAutocomplete({
  value, onChange, fornecedoresDB, fornExtras, onAddFornecedor,
}: {
  value: string; onChange: (v: string) => void;
  fornecedoresDB: any[]; fornExtras: { nome: string; categoria: string }[];
  onAddFornecedor: (nome: string, cat: string) => void;
}) {
  const [query, setQuery]       = useState('');
  const [aberto, setAberto]     = useState(false);
  const [novoMode, setNovoMode] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novaCat, setNovaCat]   = useState('Mercearia');
  const inputRef                = useRef<HTMLInputElement>(null);
  const containerRef            = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, []);

  const todos = useMemo(() => [
    ...fornecedoresDB,
    ...fornExtras.map((f, i) => ({ id: `extra-${i}`, nome: f.nome, categoria: f.categoria })),
  ], [fornecedoresDB, fornExtras]);

  const resultados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return todos.slice(0, 8);
    return todos.filter(f => f.nome.toLowerCase().includes(q)).slice(0, 8);
  }, [query, todos]);

  function handleClear() { onChange(''); setQuery(''); setTimeout(() => inputRef.current?.focus(), 50); }
  function handleAdd() {
    if (!novoNome.trim()) return;
    onAddFornecedor(novoNome.trim(), novaCat);
    onChange(novoNome.trim());
    setNovoMode(false); setAberto(false); setQuery(''); setNovoNome('');
  }

  if (value) {
    return (
      <span className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg px-3 py-2 text-sm font-medium">
        <Truck size={14} />{value}
        <button onClick={handleClear} className="ml-1 text-amber-400 hover:text-amber-700"><X size={12} /></button>
      </span>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input ref={inputRef} type="text" placeholder="Digite para buscar o fornecedor…" value={query}
          onChange={e => { setQuery(e.target.value); setAberto(true); setNovoMode(false); }}
          onFocus={() => setAberto(true)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
      </div>
      {aberto && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          {resultados.length > 0 ? (
            <>
              <ul className="py-1 max-h-44 overflow-y-auto">
                {resultados.map((f, i) => (
                  <li key={i}>
                    <button onClick={e => { e.stopPropagation(); onChange(f.nome); setAberto(false); setQuery(''); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-amber-50 text-left transition-colors">
                      <Truck size={14} className="text-blue-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{f.nome}</p>
                        <p className="text-xs text-gray-400">{f.categoria}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="border-t border-gray-100 px-4 py-2">
                <button onClick={e => { e.stopPropagation(); setNovoMode(true); setAberto(false); setNovoNome(query); }}
                  className="text-xs text-amber-700 font-medium flex items-center gap-1 hover:text-amber-900">
                  <Plus size={12} /> Cadastrar fornecedor
                </button>
              </div>
            </>
          ) : (
            <div className="p-4">
              <p className="text-sm text-gray-500 mb-3">Nenhum resultado para <strong>"{query}"</strong></p>
              <button onClick={e => { e.stopPropagation(); setNovoMode(true); setAberto(false); setNovoNome(query); }}
                className="flex items-center gap-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-lg transition-colors">
                <Plus size={14} /> Cadastrar fornecedor
              </button>
            </div>
          )}
        </div>
      )}
      {novoMode && (
        <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-blue-900 flex items-center gap-2"><Truck size={14} /> Novo fornecedor</p>
            <button onClick={() => setNovoMode(false)} className="text-blue-400 hover:text-blue-700"><X size={14} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nome *</label>
              <input type="text" value={novoNome} onChange={e => setNovoNome(e.target.value)} autoFocus placeholder="Ex: Moinho ABC"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Categoria</label>
              <select value={novaCat} onChange={e => setNovaCat(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                {['Mercearia','Laticínios','Carnes','Bebidas','Confeitaria','Embalagens'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button onClick={handleAdd} disabled={!novoNome.trim()}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 bg-blue-600 hover:bg-blue-700 transition-colors">
              Cadastrar e selecionar
            </button>
            <button onClick={() => setNovoMode(false)} className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BoletosPage() {
  const [listaBoletos, setListaBoletos]   = useState<any[]>([]);
  const [fornecedoresDB, setFornecedoresDB] = useState<any[]>([]);
  const [categoriasBoletoDB, setCategoriasBoletoDB] = useState<{ nome: string; categoria_pai: string }[]>([]);
  const [carregando, setCarregando]       = useState(true);
  const [salvando, setSalvando]           = useState(false);
  const [erro, setErro]                   = useState('');
  const [filtroStatus, setFiltroStatus]   = useState<'todos' | 'pendente' | 'vencido' | 'pago'>('todos');
  const { filtroUnidade, unidades }        = useUnit();
  const { mesInicio, mesFim, ano }         = useDateRange();

  const periodoLabel = mesInicio === mesFim
    ? `${MESES[mesInicio]} ${ano}`
    : `${MESES[mesInicio]}–${MESES[mesFim]} ${ano}`;

  const inRange = (dataStr: string) => {
    if (!dataStr) return false;
    const [y, m] = dataStr.split('-').map(Number);
    return y === ano && (m - 1) >= mesInicio && (m - 1) <= mesFim;
  };

  const categoriasBoletoDyn = useMemo(() => {
    if (categoriasBoletoDB.length === 0) return CATEGORIAS_BOLETO_FALLBACK;
    const groups: Record<string, string[]> = {};
    for (const c of categoriasBoletoDB) {
      const pai = (c.categoria_pai || 'Outros').trim();
      if (!groups[pai]) groups[pai] = [];
      groups[pai].push(c.nome);
    }
    return Object.entries(groups).map(([nome, subs]) => ({ nome, subs }));
  }, [categoriasBoletoDB]);

  function getUnitBadge(unidade_id: string) {
    const idx = unidades.findIndex(u => u.id === unidade_id);
    const nome = unidades[idx]?.nome ?? unidade_id;
    const cor  = CORES_BG_BADGE[idx >= 0 ? idx % CORES_BG_BADGE.length : 0];
    return { nome, cor };
  }
  const [modalOpen, setModalOpen]         = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingBoleto, setEditingBoleto] = useState<any>(null);
  const [salvandoEdit, setSalvandoEdit]   = useState(false);
  const [erroEdit, setErroEdit]           = useState('');
  const [fornExtras, setFornExtras]       = useState<{ nome: string; categoria: string }[]>([]);
  const [pagandoBoleto, setPagandoBoleto]   = useState<any>(null);
  const [formValorPago, setFormValorPago]   = useState('');
  const [salvandoPagamento, setSalvandoPagamento] = useState(false);
  // Campos do formulário
  const [formUnidade, setFormUnidade]   = useState('1');
  const [formForn, setFormForn]         = useState('');
  const [formCat, setFormCat]           = useState('');
  const [formSubCat, setFormSubCat]     = useState('');
  const [formValor, setFormValor]       = useState('');
  const [formVenc, setFormVenc]         = useState('');
  const [formStatus, setFormStatus]     = useState('pendente');
  const [formVinculado, setFormVinculado] = useState(false);

  async function carregarDados() {
    const supabase = createClient();
    const [{ data: boletosData }, { data: fornData }, { data: catBol }] = await Promise.all([
      supabase.from('boletos').select('*').order('vencimento', { ascending: true }),
      supabase.from('fornecedores').select('*').order('nome'),
      supabase.from('categorias_boleto').select('nome, categoria_pai').order('categoria_pai').order('nome'),
    ]);
    setListaBoletos(boletosData || []);
    setFornecedoresDB(fornData || []);
    setCategoriasBoletoDB((catBol || []) as { nome: string; categoria_pai: string }[]);
    setCarregando(false);
  }

  useEffect(() => { carregarDados(); }, []);

  const lista = listaBoletos.filter(b => {
    const statusComp   = calcStatus(b);
    const matchStatus  = filtroStatus === 'todos' || statusComp === filtroStatus;
    const matchUnidade = filtroUnidade === 'todas' || b.unidade_id === filtroUnidade;
    const matchData    = inRange(b.vencimento);
    return matchStatus && matchUnidade && matchData;
  });

  const boletosUni = filtroUnidade === 'todas' ? listaBoletos : listaBoletos.filter(b => b.unidade_id === filtroUnidade);
  const vencidos      = boletosUni.filter(b => calcStatus(b) === 'vencido');
  const aVencer       = boletosUni.filter(b => calcStatus(b) === 'pendente');
  const totalPendente = boletosUni.filter(b => calcStatus(b) !== 'pago').reduce((a, b) => a + Number(b.valor), 0);
  const totalJuros    = boletosUni
    .filter(b => calcStatus(b) === 'pago' && b.valor_pago != null)
    .reduce((a, b) => a + (Number(b.valor_pago) - Number(b.valor)), 0);

  function handleSubCat(sub: string) {
    setFormSubCat(sub);
    const cat = categoriasBoletoDyn.find(c => c.subs.includes(sub));
    setFormCat(cat?.nome ?? '');
  }

  function handleOpenModal() {
    setFormForn(''); setFormCat(''); setFormSubCat(''); setFormValor('');
    setFormVenc(''); setFormStatus('pendente'); setFormVinculado(false); setErro('');
    setModalOpen(true);
  }

  async function handleSalvar() {
    if (!formForn) { setErro('Selecione um fornecedor.'); return; }
    if (!formValor || parseFloat(formValor) <= 0) { setErro('Informe o valor.'); return; }
    if (!formVenc) { setErro('Informe o vencimento.'); return; }
    setSalvando(true); setErro('');
    const supabase = createClient();
    const { error } = await supabase.from('boletos').insert({
      id: `b-${Date.now()}`,
      unidade_id: formUnidade,
      fornecedor: formForn,
      categoria: formCat || 'Outros',
      sub_categoria: formSubCat || '',
      valor: parseFloat(formValor),
      vencimento: formVenc,
      status: formStatus,
      vinculado_compra: formVinculado,
    });
    if (error) { setErro('Erro ao salvar: ' + error.message); setSalvando(false); return; }
    await carregarDados();
    setSalvando(false);
    setModalOpen(false);
  }

  function handleMarcarPago(boleto: any) {
    setPagandoBoleto(boleto);
    setFormValorPago(String(boleto.valor || ''));
  }

  async function handleConfirmarPagamento() {
    if (!pagandoBoleto) return;
    setSalvandoPagamento(true);
    const supabase = createClient();
    await supabase.from('boletos').update({
      status: 'pago',
      data_pagamento: new Date().toISOString().split('T')[0],
      valor_pago: parseFloat(formValorPago) || Number(pagandoBoleto.valor),
    }).eq('id', pagandoBoleto.id);
    await carregarDados();
    setSalvandoPagamento(false);
    setPagandoBoleto(null);
    setFormValorPago('');
  }

  function handleOpenEditar(boleto: any) {
    setEditingBoleto(boleto);
    setFormUnidade(boleto.unidade_id || '1');
    setFormForn(boleto.fornecedor || '');
    setFormCat(boleto.categoria || '');
    setFormSubCat(boleto.sub_categoria || '');
    setFormValor(String(boleto.valor || ''));
    setFormVenc(boleto.vencimento || '');
    setFormStatus(boleto.status || 'pendente');
    setFormVinculado(!!boleto.vinculado_compra);
    setFormValorPago(boleto.valor_pago ? String(boleto.valor_pago) : '');
    setErroEdit('');
    setEditModalOpen(true);
  }

  async function handleSalvarEdicao() {
    if (!formForn) { setErroEdit('Selecione um fornecedor.'); return; }
    if (!formValor || parseFloat(formValor) <= 0) { setErroEdit('Informe o valor.'); return; }
    if (!formVenc) { setErroEdit('Informe o vencimento.'); return; }
    setSalvandoEdit(true); setErroEdit('');
    const supabase = createClient();
    const { error } = await supabase.from('boletos').update({
      unidade_id: formUnidade,
      fornecedor: formForn,
      categoria: formCat || 'Outros',
      sub_categoria: formSubCat || '',
      valor: parseFloat(formValor),
      vencimento: formVenc,
      status: formStatus,
      vinculado_compra: formVinculado,
      valor_pago: formStatus === 'pago'
        ? (formValorPago ? parseFloat(formValorPago) : parseFloat(formValor))
        : null,
    }).eq('id', editingBoleto.id);
    if (error) { setErroEdit('Erro ao salvar: ' + error.message); setSalvandoEdit(false); return; }
    await carregarDados();
    setSalvandoEdit(false);
    setEditModalOpen(false);
    setEditingBoleto(null);
  }

  async function handleAddFornecedorDB(nome: string, cat: string) {
    setFornExtras(prev => [...prev, { nome, categoria: cat }]);
    const supabase = createClient();
    await supabase.from('fornecedores').insert({ id: `forn-${Date.now()}`, nome, categoria: cat, ativo: true });
    const { data } = await supabase.from('fornecedores').select('*').order('nome');
    if (data) setFornecedoresDB(data);
  }

  return (
    <>
      <Header title="Gestão de Boletos" />
      <main className="flex-1 overflow-y-auto p-6 space-y-5">

        {!carregando && vencidos.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-red-700">{vencidos.length} boleto{vencidos.length > 1 ? 's' : ''} vencido{vencidos.length > 1 ? 's' : ''} — regularize para evitar multas</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {vencidos.map(v => {
                const ub = getUnitBadge(v.unidade_id);
                return (
                  <div key={v.id} className="flex items-center gap-1.5 bg-white border border-red-200 rounded-lg px-3 py-1.5">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ub.cor}`}>{ub.nome}</span>
                    <span className="text-xs text-gray-700 font-medium">{v.fornecedor}</span>
                    <span className="text-xs text-red-600 font-semibold">{formatCurrency(Number(v.valor))}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!carregando && aVencer.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-amber-800">{aVencer.length} boleto{aVencer.length > 1 ? 's' : ''} pendente{aVencer.length > 1 ? 's' : ''} · {formatCurrency(aVencer.reduce((a, b) => a + Number(b.valor), 0))} no total</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
              {aVencer.map(b => {
                const ub = getUnitBadge(b.unidade_id);
                return (
                <div key={b.id} className="bg-white border border-amber-100 rounded-lg px-3 py-2.5 flex items-center gap-3">
                  <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg ${ub.cor}`}>{ub.nome}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-900 truncate">{b.fornecedor}</p>
                    <p className="text-xs text-gray-400">{b.sub_categoria} · vence {formatDate(b.vencimento)}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-800 flex-shrink-0 tabular-nums">{formatCurrency(Number(b.valor))}</span>
                </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Total em Aberto</p>
            <p className="text-[1.4rem] leading-none font-display italic text-red-600">{formatCurrency(totalPendente)}</p>
            <p className="text-xs text-gray-400 mt-1">Pendente + Vencido</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">A Vencer</p>
            <p className="text-[1.4rem] leading-none font-display italic text-amber-600">{aVencer.length} boletos</p>
            <p className="text-xs text-gray-400 mt-1">{formatCurrency(aVencer.reduce((a, b) => a + Number(b.valor), 0))}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Vencidos</p>
            <p className="text-[1.4rem] leading-none font-display italic text-red-600">{vencidos.length} boletos</p>
            <p className="text-xs text-gray-400 mt-1">{formatCurrency(vencidos.reduce((a, b) => a + Number(b.valor), 0))}</p>
          </div>
          <div className={`bg-white rounded-xl border p-4 ${totalJuros > 0 ? 'border-red-200 bg-red-50/30' : totalJuros < 0 ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}`}>
            <p className="text-xs text-gray-500 mb-1">Juros/Multas Pagos</p>
            <p className={`text-[1.4rem] leading-none font-display italic ${totalJuros > 0 ? 'text-red-600' : totalJuros < 0 ? 'text-green-600' : 'text-gray-400'}`}>
              {totalJuros !== 0 ? (totalJuros > 0 ? '+' : '') + formatCurrency(totalJuros) : '—'}
            </p>
            <p className="text-xs text-gray-400 mt-1">{totalJuros < 0 ? 'Descontos obtidos' : totalJuros > 0 ? 'Acima do valor original' : 'Nenhum registrado'}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {(['todos','pendente','vencido','pago'] as const).map(s => (
                <button key={s} onClick={() => setFiltroStatus(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${filtroStatus === s ? 'bg-amber-600 text-white' : 'text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                  {s === 'todos' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
              {filtroUnidade !== 'todas' && (
                <>
                  <div className="w-px h-4 bg-gray-200" />
                  <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                    <Building2 size={11} /> {unidades.find(u => u.id === filtroUnidade)?.nome ?? filtroUnidade}
                  </span>
                </>
              )}
            </div>
            <button onClick={handleOpenModal}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#D97706' }}>
              <Plus size={15} /> Novo Boleto
            </button>
          </div>

          {carregando ? (
            <div className="py-16 text-center text-gray-400 text-sm">Carregando…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Fornecedor','Categoria','Sub Categoria','Unidade','Valor','Valor Pago','Juros/Multa','Vencimento','Vínculo','Status','Ação'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lista.map(b => {
                    const ub = getUnitBadge(b.unidade_id);
                    const statusComp = calcStatus(b);
                    return (
                    <tr key={b.id} className={`hover:bg-gray-50 ${statusComp === 'vencido' ? 'bg-red-50/40' : ''}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          {b.fornecedor}
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ub.cor}`}>
                            {ub.nome}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{b.categoria}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{b.sub_categoria}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${ub.cor}`}>
                          {ub.nome}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 tabular-nums">{formatCurrency(Number(b.valor))}</td>
                      <td className="px-4 py-3 tabular-nums text-sm">
                        {b.valor_pago != null
                          ? <span className="font-semibold text-gray-900">{formatCurrency(Number(b.valor_pago))}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-sm">
                        {b.valor_pago != null ? (() => {
                          const juros = Number(b.valor_pago) - Number(b.valor);
                          if (Math.abs(juros) < 0.01) return <span className="text-gray-400">—</span>;
                          return (
                            <span className={`font-semibold ${juros > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {juros > 0 ? '+' : ''}{formatCurrency(juros)}
                            </span>
                          );
                        })() : <span className="text-gray-300">—</span>}
                      </td>
                      <td className={`px-4 py-3 text-sm whitespace-nowrap ${b.status === 'vencido' ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                        {formatDate(b.vencimento)}
                      </td>
                      <td className="px-4 py-3">
                        {b.vinculado_compra && (
                          <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full ring-1 ring-purple-600/20">
                            <Link2 size={10} /> Compra
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={statusComp} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleOpenEditar(b)}
                            title="Editar boleto"
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                            <Pencil size={13} />
                          </button>
                          {statusComp !== 'pago' && (
                            <button onClick={() => handleMarcarPago(b)}
                              title="Marcar como pago"
                              className="flex items-center gap-1 text-xs text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-2.5 py-1 rounded-lg transition-colors">
                              <CheckCircle2 size={12} /> Pago
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                  {lista.length === 0 && (
                    <tr><td colSpan={11} className="px-4 py-10 text-center text-gray-400 text-sm">Nenhum boleto encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Link2 size={12} />
          <span>Boletos marcados com <strong className="text-purple-600">Compra</strong> estão vinculados a uma compra de insumo — não entram como despesa duplicada na DRE.</span>
        </div>
      </main>

      {/* Modal de edição */}
      <Modal open={editModalOpen} onClose={() => { setEditModalOpen(false); setEditingBoleto(null); }} title="Editar Boleto" size="md">
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

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Fornecedor</label>
            <FornecedorAutocomplete key={editModalOpen ? `edit-${editingBoleto?.id}` : 'edit-closed'}
              value={formForn} onChange={setFormForn}
              fornecedoresDB={fornecedoresDB} fornExtras={fornExtras}
              onAddFornecedor={handleAddFornecedorDB}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Subcategoria</label>
            <select value={formSubCat} onChange={e => handleSubCat(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
              <option value="">Selecione a subcategoria…</option>
              {categoriasBoletoDyn.map(cat => (
                <optgroup key={cat.nome} label={cat.nome}>
                  {cat.subs.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          {formCat && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <span className="text-xs text-blue-600">Categoria principal:</span>
              <span className="text-xs font-bold text-blue-800">{formCat}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Valor (R$)</label>
              <input type="number" placeholder="0,00" min={0} step="0.01" value={formValor}
                onChange={e => setFormValor(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Vencimento</label>
              <input type="date" value={formVenc} onChange={e => setFormVenc(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Status</label>
            <select value={formStatus} onChange={e => setFormStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
              <option value="vencido">Vencido</option>
            </select>
          </div>

          {formStatus === 'pago' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Valor pago (R$)</label>
              <input type="number" placeholder={formValor || '0,00'} min={0} step="0.01" value={formValorPago}
                onChange={e => setFormValorPago(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
              {formValorPago && formValor && (() => {
                const juros = parseFloat(formValorPago) - parseFloat(formValor);
                if (Math.abs(juros) < 0.01) return null;
                return (
                  <p className={`text-xs mt-1 font-medium ${juros > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {juros > 0 ? `Juros/Multa: +${formatCurrency(juros)}` : `Desconto: ${formatCurrency(juros)}`}
                  </p>
                );
              })()}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input type="checkbox" id="vinculado-edit" className="w-4 h-4 accent-amber-600"
              checked={formVinculado} onChange={e => setFormVinculado(e.target.checked)} />
            <label htmlFor="vinculado-edit" className="text-xs text-gray-700 flex items-center gap-1">
              <Link2 size={12} className="text-purple-600" />
              Vincular a uma compra de insumo
            </label>
          </div>

          {erroEdit && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erroEdit}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setEditModalOpen(false); setEditingBoleto(null); }} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={handleSalvarEdicao} disabled={salvandoEdit}
              className="px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60" style={{ backgroundColor: '#D97706' }}>
              {salvandoEdit ? 'Salvando…' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo Boleto" size="md">
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

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Fornecedor</label>
            <FornecedorAutocomplete key={modalOpen ? 'open' : 'closed'}
              value={formForn} onChange={setFormForn}
              fornecedoresDB={fornecedoresDB} fornExtras={fornExtras}
              onAddFornecedor={handleAddFornecedorDB}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Subcategoria</label>
            <select value={formSubCat} onChange={e => handleSubCat(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
              <option value="">Selecione a subcategoria…</option>
              {categoriasBoletoDyn.map(cat => (
                <optgroup key={cat.nome} label={cat.nome}>
                  {cat.subs.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          {formCat && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <span className="text-xs text-blue-600">Categoria principal:</span>
              <span className="text-xs font-bold text-blue-800">{formCat}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Valor (R$)</label>
              <input type="number" placeholder="0,00" min={0} step="0.01" value={formValor}
                onChange={e => setFormValor(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Vencimento</label>
              <input type="date" value={formVenc} onChange={e => setFormVenc(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Status</label>
            <select value={formStatus} onChange={e => setFormStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
              <option value="vencido">Vencido</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="vinculado" className="w-4 h-4 accent-amber-600"
              checked={formVinculado} onChange={e => setFormVinculado(e.target.checked)} />
            <label htmlFor="vinculado" className="text-xs text-gray-700 flex items-center gap-1">
              <Link2 size={12} className="text-purple-600" />
              Vincular a uma compra de insumo (não duplica na DRE)
            </label>
          </div>

          {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={handleSalvar} disabled={salvando}
              className="px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60" style={{ backgroundColor: '#D97706' }}>
              {salvando ? 'Salvando…' : 'Salvar Boleto'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de confirmação de pagamento */}
      <Modal open={pagandoBoleto !== null} onClose={() => { setPagandoBoleto(null); setFormValorPago(''); }} title="Registrar Pagamento" size="sm">
        {pagandoBoleto && (
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1">
              <p className="text-xs text-gray-500">Boleto</p>
              <p className="text-sm font-semibold text-gray-900">{pagandoBoleto.fornecedor}</p>
              {pagandoBoleto.sub_categoria && <p className="text-xs text-gray-400">{pagandoBoleto.sub_categoria}</p>}
              <p className="text-sm text-gray-700 mt-1">Valor original: <strong>{formatCurrency(Number(pagandoBoleto.valor))}</strong></p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Valor efetivamente pago (R$)</label>
              <input
                autoFocus
                type="number"
                min={0}
                step="0.01"
                value={formValorPago}
                onChange={e => setFormValorPago(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 tabular-nums"
              />
              <p className="text-xs text-gray-400 mt-1">Se igual ao valor original, deixe como está.</p>
            </div>

            {formValorPago && (() => {
              const juros = parseFloat(formValorPago) - Number(pagandoBoleto.valor);
              if (Math.abs(juros) < 0.01) return null;
              return (
                <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${juros > 0 ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
                  {juros > 0
                    ? `Juros/Multa: +${formatCurrency(juros)}`
                    : `Desconto obtido: ${formatCurrency(juros)}`}
                </div>
              );
            })()}

            <div className="flex justify-end gap-3 pt-1">
              <button onClick={() => { setPagandoBoleto(null); setFormValorPago(''); }} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={handleConfirmarPagamento} disabled={salvandoPagamento || !formValorPago}
                className="px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60 bg-green-600 hover:bg-green-700 transition-colors">
                {salvandoPagamento ? 'Salvando…' : 'Confirmar Pagamento'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
