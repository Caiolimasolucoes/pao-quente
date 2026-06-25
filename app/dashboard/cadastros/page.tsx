'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { Plus, Pencil, Building2, X, Check, CreditCard, Target, Save } from 'lucide-react';
import { useFormasPagamento } from '@/contexts/FormasPagamentoContext';
import { useMetas, DEFAULT_DESP } from '@/contexts/MetasContext';
import type { MetaFaturamento, MetaDespesaCategoria, MetaLucro } from '@/contexts/MetasContext';
import { createClient } from '@/lib/supabase/client';

type Aba = 'unidades' | 'produtos' | 'fornecedores' | 'cat-compras' | 'cat-boletos' | 'unid-medida' | 'pagamento' | 'metas';

const abas: { key: Aba; label: string }[] = [
  { key: 'unidades',    label: 'Unidades' },
  { key: 'produtos',    label: 'Produtos' },
  { key: 'fornecedores',label: 'Fornecedores' },
  { key: 'cat-compras', label: 'Cat. Compras' },
  { key: 'cat-boletos', label: 'Cat. Boletos' },
  { key: 'unid-medida', label: 'Und. Medida' },
  { key: 'pagamento',   label: 'Formas Pgto.' },
  { key: 'metas',       label: 'Metas' },
];

const CORES_PRESET = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B',
  '#EF4444', '#6B7280', '#EC4899', '#14B8A6',
];

function TableWrapper({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">{label}</span>
        <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#D97706' }}>
          <Plus size={14} /> Novo
        </button>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

const TIPOS_FAT: { tipo: MetaFaturamento['tipo']; label: string }[] = [
  { tipo: 'diario',  label: 'Diário' },
  { tipo: 'semanal', label: 'Semanal' },
  { tipo: 'mensal',  label: 'Mensal' },
  { tipo: 'anual',   label: 'Anual' },
];

const TIPOS_LUCRO: { tipo: MetaLucro['tipo']; label: string }[] = [
  { tipo: 'mensal', label: 'Mensal' },
  { tipo: 'anual',  label: 'Anual' },
];

const UNIDADES_OPT: { value: 'todas' | '1' | '2'; label: string }[] = [
  { value: 'todas', label: 'Todas as unidades' },
  { value: '1',     label: 'Centro' },
  { value: '2',     label: 'Bairro' },
];

export default function CadastrosPage() {
  const [aba, setAba] = useState<Aba>('unidades');
  const [catExpand, setCatExpand] = useState<string | null>(null);
  const { formas, toggleForma, adicionarForma, removerForma } = useFormasPagamento();

  // DB state
  const [unidadesPadaria, setUnidadesPadaria] = useState<any[]>([]);
  const [produtos, setProdutos]               = useState<any[]>([]);
  const [fornecedores, setFornecedores]       = useState<any[]>([]);
  const [categoriasCompra, setCategoriasCompra] = useState<any[]>([]);
  const [categoriasBoleto, setCategoriasBoleto] = useState<any[]>([]);
  const [unidades, setUnidades]               = useState<any[]>([]);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('unidades').select('*').order('id'),
      supabase.from('produtos').select('*').order('nome'),
      supabase.from('fornecedores').select('*').order('nome'),
      supabase.from('categorias_compra').select('*').order('nome'),
      supabase.from('categorias_boleto').select('*').order('nome'),
      supabase.from('unidades_medida').select('*').order('sigla'),
    ]).then(([u, p, f, cc, cb, um]) => {
      setUnidadesPadaria(u.data || []);
      setProdutos(p.data || []);
      setFornecedores(f.data || []);
      setCategoriasCompra(cc.data || []);
      setCategoriasBoleto(cb.data?.map((c: any) => ({ ...c, subcategorias: c.subcategorias || [] })) || []);
      setUnidades(um.data || []);
    });
  }, []);
  const [novaForma, setNovaForma] = useState('');
  const [novaCor, setNovaCor] = useState('#10B981');
  const [adicionando, setAdicionando] = useState(false);

  // ── Metas state ───────────────────────────────────────────────
  const { metasFaturamento, metasDespesa, metasLucro, salvarMetasFaturamento, salvarMetasDespesa, salvarMetasLucro } = useMetas();

  const [anoFat,    setAnoFat]    = useState(2026);
  const [unidFat,   setUnidFat]   = useState<'todas'|'1'|'2'>('todas');
  const [draftFat,  setDraftFat]  = useState<Record<string, string>>({});
  const [savedFat,  setSavedFat]  = useState(false);

  const [anoDesp,   setAnoDesp]   = useState(2026);
  const [unidDesp,  setUnidDesp]  = useState<'todas'|'1'|'2'>('todas');
  const [draftDesp, setDraftDesp] = useState<Record<string, string>>({});
  const [savedDesp, setSavedDesp] = useState(false);

  const [anoLucro,   setAnoLucro]   = useState(2026);
  const [unidLucro,  setUnidLucro]  = useState<'todas'|'1'|'2'>('todas');
  const [draftLucro, setDraftLucro] = useState<Record<string, string>>({});
  const [savedLucro, setSavedLucro] = useState(false);

  function getValFat(tipo: MetaFaturamento['tipo']) {
    const key = `${tipo}-${anoFat}-${unidFat}`;
    if (key in draftFat) return draftFat[key];
    return String(metasFaturamento.find((m) => m.tipo === tipo && m.ano === anoFat && m.unidadeId === unidFat)?.valor ?? '');
  }

  function setValFat(tipo: MetaFaturamento['tipo'], val: string) {
    setDraftFat((p) => ({ ...p, [`${tipo}-${anoFat}-${unidFat}`]: val }));
    setSavedFat(false);
  }

  function handleSalvarFat() {
    const base = metasFaturamento.filter((m) => !(m.ano === anoFat && m.unidadeId === unidFat));
    const novas: MetaFaturamento[] = TIPOS_FAT.map(({ tipo }, i) => {
      const key = `${tipo}-${anoFat}-${unidFat}`;
      const v = parseFloat(draftFat[key] ?? String(metasFaturamento.find((m) => m.tipo === tipo && m.ano === anoFat && m.unidadeId === unidFat)?.valor ?? 0));
      return { id: `fat-${anoFat}-${unidFat}-${tipo}-${i}`, tipo, valor: isNaN(v) ? 0 : v, ano: anoFat, unidadeId: unidFat };
    });
    salvarMetasFaturamento([...base, ...novas]);
    setSavedFat(true);
  }

  function getValDesp(categoriaKey: string) {
    const key = `${categoriaKey}-${anoDesp}-${unidDesp}`;
    if (key in draftDesp) return draftDesp[key];
    return String(metasDespesa.find((m) => m.categoriaKey === categoriaKey && m.ano === anoDesp && m.unidadeId === unidDesp)?.percentualMax ?? '');
  }

  function setValDesp(categoriaKey: string, val: string) {
    setDraftDesp((p) => ({ ...p, [`${categoriaKey}-${anoDesp}-${unidDesp}`]: val }));
    setSavedDesp(false);
  }

  function handleSalvarDesp() {
    const base = metasDespesa.filter((m) => !(m.ano === anoDesp && m.unidadeId === unidDesp));
    const novas: MetaDespesaCategoria[] = DEFAULT_DESP.map((d) => {
      const key = `${d.categoriaKey}-${anoDesp}-${unidDesp}`;
      const v = parseFloat(draftDesp[key] ?? String(metasDespesa.find((m) => m.categoriaKey === d.categoriaKey && m.ano === anoDesp && m.unidadeId === unidDesp)?.percentualMax ?? d.percentualMax));
      return { ...d, percentualMax: isNaN(v) ? d.percentualMax : v, ano: anoDesp, unidadeId: unidDesp };
    });
    salvarMetasDespesa([...base, ...novas]);
    setSavedDesp(true);
  }

  function getValLucro(tipo: MetaLucro['tipo']) {
    const key = `${tipo}-${anoLucro}-${unidLucro}`;
    if (key in draftLucro) return draftLucro[key];
    return String(metasLucro.find((m) => m.tipo === tipo && m.ano === anoLucro && m.unidadeId === unidLucro)?.valor ?? '');
  }

  function setValLucro(tipo: MetaLucro['tipo'], val: string) {
    setDraftLucro((p) => ({ ...p, [`${tipo}-${anoLucro}-${unidLucro}`]: val }));
    setSavedLucro(false);
  }

  function handleSalvarLucro() {
    const base = metasLucro.filter((m) => !(m.ano === anoLucro && m.unidadeId === unidLucro));
    const novas: MetaLucro[] = TIPOS_LUCRO.map(({ tipo }, i) => {
      const key = `${tipo}-${anoLucro}-${unidLucro}`;
      const v = parseFloat(draftLucro[key] ?? String(metasLucro.find((m) => m.tipo === tipo && m.ano === anoLucro && m.unidadeId === unidLucro)?.valor ?? 0));
      return { id: `lucro-${anoLucro}-${unidLucro}-${tipo}-${i}`, tipo, valor: isNaN(v) ? 0 : v, ano: anoLucro, unidadeId: unidLucro };
    });
    salvarMetasLucro([...base, ...novas]);
    setSavedLucro(true);
  }

  return (
    <>
      <Header title="Cadastros" />
      <main className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
          {abas.map((a) => (
            <button
              key={a.key}
              onClick={() => setAba(a.key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                aba === a.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        {/* Unidades da Padaria */}
        {aba === 'unidades' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {unidadesPadaria.map((u) => (
                <div key={u.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${u.id === '1' ? 'bg-amber-100' : 'bg-blue-100'}`}>
                        <Building2 size={16} className={u.id === '1' ? 'text-amber-700' : 'text-blue-700'} />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{u.nome}</span>
                    </div>
                    <button className="text-gray-400 hover:text-amber-600 transition-colors"><Pencil size={14} /></button>
                  </div>
                  <div className="space-y-1.5 text-xs text-gray-600">
                    <p><span className="text-gray-400 font-medium">CNPJ:</span> {u.cnpj}</p>
                    <p><span className="text-gray-400 font-medium">Endereço:</span> {u.endereco}</p>
                    <p><span className="text-gray-400 font-medium">Responsável:</span> {u.responsavel}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Produtos */}
        {aba === 'produtos' && (
          <TableWrapper label={`Produtos — ${produtos.length} cadastrados`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Nome', 'Unidade', 'Categoria', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {produtos.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.nome}</td>
                    <td className="px-4 py-3"><span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded">{p.unidade}</span></td>
                    <td className="px-4 py-3 text-gray-600">{p.categoria}</td>
                    <td className="px-4 py-3"><button className="text-gray-400 hover:text-amber-600 transition-colors"><Pencil size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        )}

        {/* Fornecedores */}
        {aba === 'fornecedores' && (
          <TableWrapper label={`Fornecedores — ${fornecedores.length} cadastrados`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Nome', 'Categoria', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {fornecedores.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{f.nome}</td>
                    <td className="px-4 py-3 text-gray-600">{f.categoria}</td>
                    <td className="px-4 py-3"><button className="text-gray-400 hover:text-amber-600 transition-colors"><Pencil size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        )}

        {/* Categorias de Compras */}
        {aba === 'cat-compras' && (
          <TableWrapper label={`Categorias de Compras — ${categoriasCompra.length} cadastradas`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Nome', 'Módulo', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {categoriasCompra.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.nome}</td>
                    <td className="px-4 py-3"><span className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-full ring-1 ring-blue-600/20">Compras</span></td>
                    <td className="px-4 py-3"><button className="text-gray-400 hover:text-amber-600 transition-colors"><Pencil size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        )}

        {/* Categorias de Boletos (hierarquia) */}
        {aba === 'cat-boletos' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-gray-900">Categorias de Boletos — {categoriasBoleto.length} principais</span>
                <p className="text-xs text-gray-400 mt-0.5">Clique numa categoria para ver as subcategorias vinculadas</p>
              </div>
              <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#D97706' }}>
                <Plus size={14} /> Nova
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {categoriasBoleto.map((cat) => (
                <div key={cat.id}>
                  <button
                    onClick={() => setCatExpand(catExpand === cat.id ? null : cat.id)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-1.5 h-5 rounded-full ${catExpand === cat.id ? 'bg-amber-500' : 'bg-gray-300'}`} />
                      <span className="text-sm font-semibold text-gray-900">{cat.nome}</span>
                      <span className="text-xs text-gray-400">{cat.subcategorias.length} subcategorias</span>
                    </div>
                    <span className="text-gray-400 text-xs">{catExpand === cat.id ? '▲' : '▼'}</span>
                  </button>
                  {catExpand === cat.id && (
                    <div className="px-5 pb-4">
                      <div className="flex flex-wrap gap-2 pl-5">
                        {cat.subcategorias.map((sub: string) => (
                          <span key={sub} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                            {sub}
                            <button className="text-gray-400 hover:text-amber-600 ml-0.5"><Pencil size={10} /></button>
                          </span>
                        ))}
                        <button className="text-xs text-amber-700 hover:text-amber-900 font-medium flex items-center gap-1 px-3 py-1 border border-dashed border-amber-300 rounded-full">
                          <Plus size={10} /> Adicionar subcategoria
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formas de Pagamento */}
        {aba === 'pagamento' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-gray-900">Formas de Pagamento Aceitas</span>
                  <p className="text-xs text-gray-400 mt-0.5">Gerencie quais formas aparecerão nos lançamentos de faturamento</p>
                </div>
                <button
                  onClick={() => setAdicionando(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg"
                  style={{ backgroundColor: '#D97706' }}
                >
                  <Plus size={14} /> Nova Forma
                </button>
              </div>

              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {formas.map((f) => (
                  <div
                    key={f.id}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${
                      f.ativo
                        ? 'border-gray-200 bg-white'
                        : 'border-dashed border-gray-200 bg-gray-50 opacity-60'
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${f.cor}20` }}
                    >
                      <CreditCard size={16} style={{ color: f.cor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{f.nome}</p>
                      <p className="text-xs text-gray-400">{f.ativo ? 'Ativo' : 'Inativo'}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleForma(f.id)}
                        title={f.ativo ? 'Desativar' : 'Ativar'}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          f.ativo
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => removerForma(f.id)}
                        title="Remover"
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Formulário de nova forma */}
            {adicionando && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  <CreditCard size={15} /> Adicionar nova forma de pagamento
                </h3>
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Nome</label>
                    <input
                      type="text"
                      value={novaForma}
                      onChange={(e) => setNovaForma(e.target.value)}
                      placeholder="Ex: Hipercard, Vale Alimentação…"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Cor</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {CORES_PRESET.map((cor) => (
                        <button
                          key={cor}
                          onClick={() => setNovaCor(cor)}
                          className={`w-7 h-7 rounded-full border-2 transition-all ${novaCor === cor ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: cor }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (novaForma.trim()) {
                          adicionarForma(novaForma.trim(), novaCor);
                          setNovaForma('');
                          setNovaCor('#10B981');
                          setAdicionando(false);
                        }
                      }}
                      className="px-4 py-2 text-sm font-medium text-white rounded-lg"
                      style={{ backgroundColor: '#D97706' }}
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => { setAdicionando(false); setNovaForma(''); }}
                      className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 bg-white"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-gray-400 px-1">
              <Check size={12} className="text-emerald-500" />
              <span>As formas <strong className="text-gray-600">ativas</strong> aparecem automaticamente nos campos de lançamento de faturamento.</span>
            </div>
          </div>
        )}

        {/* ── Metas ─────────────────────────────────────────────── */}
        {aba === 'metas' && (
          <div className="space-y-6">

            {/* Metas de Faturamento */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Target size={15} className="text-amber-600" />
                  <span className="text-sm font-semibold text-gray-900">Metas de Faturamento</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <select value={anoFat} onChange={(e) => { setAnoFat(Number(e.target.value)); setSavedFat(false); setDraftFat({}); }}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                    {[2024,2025,2026,2027].map((a) => <option key={a}>{a}</option>)}
                  </select>
                  <select value={unidFat} onChange={(e) => { setUnidFat(e.target.value as 'todas'|'1'|'2'); setSavedFat(false); setDraftFat({}); }}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                    {UNIDADES_OPT.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                  </select>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-56">Meta (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {TIPOS_FAT.map(({ tipo, label }) => (
                    <tr key={tipo} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-700 font-medium">{label}</td>
                      <td className="px-5 py-3">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">R$</span>
                          <input
                            type="number"
                            min={0}
                            step={100}
                            value={getValFat(tipo)}
                            onChange={(e) => setValFat(tipo, e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-sm text-right border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 tabular-nums"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                {savedFat && <span className="text-xs text-emerald-600 flex items-center gap-1"><Check size={12} /> Metas salvas com sucesso</span>}
                {!savedFat && <span />}
                <button onClick={handleSalvarFat}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg"
                  style={{ backgroundColor: '#D97706' }}>
                  <Save size={13} /> Salvar Metas de Faturamento
                </button>
              </div>
            </div>

            {/* Metas de Despesa por Categoria DRE */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Target size={15} className="text-red-500" />
                  <span className="text-sm font-semibold text-gray-900">Metas de Despesa por Categoria DRE</span>
                  <span className="text-xs text-gray-400">— % máximo do faturamento</span>
                </div>
                <div className="flex items-center gap-2">
                  <select value={anoDesp} onChange={(e) => { setAnoDesp(Number(e.target.value)); setSavedDesp(false); setDraftDesp({}); }}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                    {[2024,2025,2026,2027].map((a) => <option key={a}>{a}</option>)}
                  </select>
                  <select value={unidDesp} onChange={(e) => { setUnidDesp(e.target.value as 'todas'|'1'|'2'); setSavedDesp(false); setDraftDesp({}); }}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                    {UNIDADES_OPT.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                  </select>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoria DRE</th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-44">Meta máxima (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {DEFAULT_DESP.map((d) => (
                    <tr key={d.categoriaKey} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-700 font-medium">{d.categoriaNome}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.5}
                            value={getValDesp(d.categoriaKey)}
                            onChange={(e) => setValDesp(d.categoriaKey, e.target.value)}
                            className="w-24 px-3 py-2 text-sm text-right border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 tabular-nums"
                          />
                          <span className="text-gray-400 text-sm font-medium">%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-400">Exemplo: Insumos = 40% significa que o gasto não deve ultrapassar 40% do faturamento</p>
                <div className="flex items-center gap-3">
                  {savedDesp && <span className="text-xs text-emerald-600 flex items-center gap-1"><Check size={12} /> Salvo</span>}
                  <button onClick={handleSalvarDesp}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg"
                    style={{ backgroundColor: '#D97706' }}>
                    <Save size={13} /> Salvar Metas de Despesa
                  </button>
                </div>
              </div>
            </div>

            {/* Metas de Lucro */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Target size={15} className="text-emerald-600" />
                  <span className="text-sm font-semibold text-gray-900">Metas de Lucro</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <select value={anoLucro} onChange={(e) => { setAnoLucro(Number(e.target.value)); setSavedLucro(false); setDraftLucro({}); }}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                    {[2024,2025,2026,2027].map((a) => <option key={a}>{a}</option>)}
                  </select>
                  <select value={unidLucro} onChange={(e) => { setUnidLucro(e.target.value as 'todas'|'1'|'2'); setSavedLucro(false); setDraftLucro({}); }}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                    {UNIDADES_OPT.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                  </select>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-56">Meta (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {TIPOS_LUCRO.map(({ tipo, label }) => (
                    <tr key={tipo} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-700 font-medium">{label}</td>
                      <td className="px-5 py-3">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">R$</span>
                          <input
                            type="number"
                            min={0}
                            step={100}
                            value={getValLucro(tipo)}
                            onChange={(e) => setValLucro(tipo, e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-sm text-right border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 tabular-nums"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                {savedLucro && <span className="text-xs text-emerald-600 flex items-center gap-1"><Check size={12} /> Metas salvas com sucesso</span>}
                {!savedLucro && <span />}
                <button onClick={handleSalvarLucro}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg"
                  style={{ backgroundColor: '#D97706' }}>
                  <Save size={13} /> Salvar Metas de Lucro
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unidades de Medida */}
        {aba === 'unid-medida' && (
          <TableWrapper label={`Unidades de Medida — ${unidades.length} cadastradas`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Sigla', 'Descrição', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {unidades.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-1 rounded">{u.sigla}</span></td>
                    <td className="px-4 py-3 text-gray-700">{u.descricao}</td>
                    <td className="px-4 py-3"><button className="text-gray-400 hover:text-amber-600 transition-colors"><Pencil size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        )}
      </main>
    </>
  );
}
