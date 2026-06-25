'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import { Plus, Pencil, Building2, X, Check, CreditCard, Target, Save, Trash2, AlertCircle } from 'lucide-react';
import { useFormasPagamento } from '@/contexts/FormasPagamentoContext';
import { useMetas, DEFAULT_DESP } from '@/contexts/MetasContext';
import { useUnit } from '@/contexts/UnitContext';
import type { MetaFaturamento, MetaDespesaCategoria, MetaLucro } from '@/contexts/MetasContext';
import { createClient } from '@/lib/supabase/client';

type Aba = 'unidades' | 'produtos' | 'fornecedores' | 'cat-compras' | 'cat-boletos' | 'unid-medida' | 'pagamento' | 'metas';
type ModalTipo = 'produto' | 'fornecedor' | 'cat-compra' | 'cat-boleto' | 'unid-medida' | 'unidade' | null;

const abas: { key: Aba; label: string }[] = [
  { key: 'unidades',     label: 'Unidades' },
  { key: 'produtos',     label: 'Produtos' },
  { key: 'fornecedores', label: 'Fornecedores' },
  { key: 'cat-compras',  label: 'Cat. Compras' },
  { key: 'cat-boletos',  label: 'Cat. Boletos' },
  { key: 'unid-medida',  label: 'Und. Medida' },
  { key: 'pagamento',    label: 'Formas Pgto.' },
  { key: 'metas',        label: 'Metas' },
];

const CORES_PRESET = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B',
  '#EF4444', '#6B7280', '#EC4899', '#14B8A6',
];

const CATEGORIAS_PRODUTO = ['Mercearia','Laticínios','Carnes','Bebidas','Confeitaria','Embalagens','Ovos / Aves','Biscoitos'];
const CATEGORIAS_FORN    = ['Mercearia','Laticínios','Carnes','Bebidas','Confeitaria','Embalagens','Outros'];

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

function modalTitle(tipo: ModalTipo, editando: boolean): string {
  const prefix = editando ? 'Editar' : 'Novo';
  const map: Record<NonNullable<ModalTipo>, string> = {
    produto: `${prefix} Produto`,
    fornecedor: `${prefix} Fornecedor`,
    'cat-compra': `${prefix} Categoria de Compra`,
    'cat-boleto': `${prefix} Categoria de Boleto`,
    'unid-medida': `${prefix} Unidade de Medida`,
    unidade: editando ? 'Editar Unidade' : 'Nova Unidade',
  };
  return tipo ? map[tipo] : '';
}

export default function CadastrosPage() {
  const [aba, setAba] = useState<Aba>('unidades');
  const [catExpand, setCatExpand] = useState<string | null>(null);
  const { formas, toggleForma, adicionarForma, removerForma } = useFormasPagamento();
  const { recarregarUnidades } = useUnit();

  // DB state
  const [unidadesPadaria, setUnidadesPadaria] = useState<any[]>([]);
  const [produtos, setProdutos]               = useState<any[]>([]);
  const [fornecedores, setFornecedores]       = useState<any[]>([]);
  const [categoriasCompra, setCategoriasCompra] = useState<any[]>([]);
  const [categoriasBoleto, setCategoriasBoleto] = useState<any[]>([]);
  const [unidades, setUnidades]               = useState<any[]>([]);

  // Modal CRUD state
  const [modalTipo, setModalTipo]       = useState<ModalTipo>(null);
  const [editandoItem, setEditandoItem] = useState<any>(null);
  const [salvandoModal, setSalvandoModal] = useState(false);
  const [erroModal, setErroModal]       = useState('');
  const [confirmDel, setConfirmDel]     = useState<{ tipo: string; id: string; nome: string } | null>(null);

  // Shared form fields
  const [fNome, setFNome]           = useState('');
  const [fCat, setFCat]             = useState('Mercearia');
  const [fUnidade, setFUnidade]     = useState('KG');
  const [fSigla, setFSigla]         = useState('');
  const [fDescricao, setFDescricao] = useState('');
  const [fSubs, setFSubs]           = useState<string[]>([]);
  const [fSubNova, setFSubNova]     = useState('');
  const [fCnpj, setFCnpj]           = useState('');
  const [fEndereco, setFEndereco]   = useState('');
  const [fResponsavel, setFResponsavel] = useState('');

  async function recarregar() {
    const supabase = createClient();
    const [u, p, f, cc, cb, um] = await Promise.all([
      supabase.from('unidades').select('*').order('id'),
      supabase.from('produtos').select('*').order('nome'),
      supabase.from('fornecedores').select('*').order('nome'),
      supabase.from('categorias_compra').select('*').order('nome'),
      supabase.from('categorias_boleto').select('*').order('nome'),
      supabase.from('unidades_medida').select('*').order('sigla'),
    ]);
    setUnidadesPadaria(u.data || []);
    setProdutos(p.data || []);
    setFornecedores(f.data || []);
    setCategoriasCompra(cc.data || []);
    setCategoriasBoleto(cb.data?.map((c: any) => ({ ...c, subcategorias: c.subcategorias || [] })) || []);
    setUnidades(um.data || []);
  }

  useEffect(() => { recarregar(); }, []);

  function abrirNovo(tipo: ModalTipo) {
    setModalTipo(tipo);
    setEditandoItem(null);
    setFNome(''); setFCat('Mercearia'); setFUnidade('KG');
    setFSigla(''); setFDescricao(''); setFSubs([]); setFSubNova('');
    setFCnpj(''); setFEndereco(''); setFResponsavel('');
    setErroModal('');
  }

  function abrirEditar(tipo: ModalTipo, item: any) {
    setModalTipo(tipo);
    setEditandoItem(item);
    setFNome(item.nome || '');
    setFCat(item.categoria || 'Mercearia');
    setFUnidade(item.unidade || 'KG');
    setFSigla(item.sigla || '');
    setFDescricao(item.descricao || '');
    setFSubs(item.subcategorias || []);
    setFSubNova('');
    setFCnpj(item.cnpj || '');
    setFEndereco(item.endereco || '');
    setFResponsavel(item.responsavel || '');
    setErroModal('');
  }

  async function handleSalvar() {
    if (!modalTipo) return;
    setErroModal('');
    setSalvandoModal(true);
    const supabase = createClient();
    try {
      if (modalTipo === 'produto') {
        if (!fNome.trim()) throw new Error('Informe o nome do produto.');
        if (editandoItem) {
          const { error } = await supabase.from('produtos').update({ nome: fNome.trim(), categoria: fCat, unidade: fUnidade }).eq('id', editandoItem.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('produtos').insert({ id: `prod-${Date.now()}`, nome: fNome.trim(), categoria: fCat, unidade: fUnidade, ativo: true });
          if (error) throw error;
        }
      } else if (modalTipo === 'fornecedor') {
        if (!fNome.trim()) throw new Error('Informe o nome do fornecedor.');
        if (editandoItem) {
          const { error } = await supabase.from('fornecedores').update({ nome: fNome.trim(), categoria: fCat }).eq('id', editandoItem.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('fornecedores').insert({ id: `forn-${Date.now()}`, nome: fNome.trim(), categoria: fCat, ativo: true });
          if (error) throw error;
        }
      } else if (modalTipo === 'cat-compra') {
        if (!fNome.trim()) throw new Error('Informe o nome da categoria.');
        if (editandoItem) {
          const { error } = await supabase.from('categorias_compra').update({ nome: fNome.trim() }).eq('id', editandoItem.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('categorias_compra').insert({ id: `cc-${Date.now()}`, nome: fNome.trim() });
          if (error) throw error;
        }
      } else if (modalTipo === 'cat-boleto') {
        if (!fNome.trim()) throw new Error('Informe o nome da categoria.');
        if (editandoItem) {
          const { error } = await supabase.from('categorias_boleto').update({ nome: fNome.trim(), subcategorias: fSubs }).eq('id', editandoItem.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('categorias_boleto').insert({ id: `cb-${Date.now()}`, nome: fNome.trim(), subcategorias: fSubs });
          if (error) throw error;
        }
      } else if (modalTipo === 'unid-medida') {
        if (!fSigla.trim()) throw new Error('Informe a sigla.');
        if (editandoItem) {
          const { error } = await supabase.from('unidades_medida').update({ sigla: fSigla.trim().toUpperCase(), descricao: fDescricao.trim() }).eq('id', editandoItem.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('unidades_medida').insert({ id: `um-${Date.now()}`, sigla: fSigla.trim().toUpperCase(), descricao: fDescricao.trim() });
          if (error) throw error;
        }
      } else if (modalTipo === 'unidade') {
        if (!fNome.trim()) throw new Error('Informe o nome da unidade.');
        if (editandoItem) {
          const { error } = await supabase.from('unidades').update({ nome: fNome.trim(), cnpj: fCnpj.trim(), endereco: fEndereco.trim(), responsavel: fResponsavel.trim() }).eq('id', editandoItem.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('unidades').insert({ id: `u-${Date.now()}`, nome: fNome.trim(), cnpj: fCnpj.trim(), endereco: fEndereco.trim(), responsavel: fResponsavel.trim() });
          if (error) throw error;
        }
        await recarregarUnidades();
      }
      await recarregar();
      setModalTipo(null);
    } catch (e: any) {
      setErroModal(e.message || 'Erro ao salvar. Tente novamente.');
    } finally {
      setSalvandoModal(false);
    }
  }

  async function handleDeletar() {
    if (!confirmDel) return;
    const supabase = createClient();
    const tableMap: Record<string, string> = {
      produto: 'produtos', fornecedor: 'fornecedores',
      'cat-compra': 'categorias_compra', 'cat-boleto': 'categorias_boleto',
      'unid-medida': 'unidades_medida',
    };
    const table = tableMap[confirmDel.tipo];
    if (table) await supabase.from(table).delete().eq('id', confirmDel.id);
    await recarregar();
    setConfirmDel(null);
  }

  // ── Formas de pagamento ────────────────────────────────────────
  const [novaForma, setNovaForma] = useState('');
  const [novaCor, setNovaCor]     = useState('#10B981');
  const [adicionando, setAdicionando] = useState(false);

  // ── Metas ─────────────────────────────────────────────────────
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
  function setValFat(tipo: MetaFaturamento['tipo'], val: string) { setDraftFat((p) => ({ ...p, [`${tipo}-${anoFat}-${unidFat}`]: val })); setSavedFat(false); }

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
  function setValDesp(categoriaKey: string, val: string) { setDraftDesp((p) => ({ ...p, [`${categoriaKey}-${anoDesp}-${unidDesp}`]: val })); setSavedDesp(false); }

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
  function setValLucro(tipo: MetaLucro['tipo'], val: string) { setDraftLucro((p) => ({ ...p, [`${tipo}-${anoLucro}-${unidLucro}`]: val })); setSavedLucro(false); }

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

  // ── Helpers ────────────────────────────────────────────────────
  function BtnNovo({ label, onClick }: { label: string; onClick: () => void }) {
    return (
      <button onClick={onClick} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#D97706' }}>
        <Plus size={14} /> {label}
      </button>
    );
  }

  function BtnAcoes({ onEdit, onDel }: { onEdit: () => void; onDel: () => void }) {
    return (
      <div className="flex items-center gap-1">
        <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Editar"><Pencil size={13} /></button>
        <button onClick={onDel}  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={13} /></button>
      </div>
    );
  }

  return (
    <>
      <Header title="Cadastros" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl flex-wrap">
          {abas.map((a) => (
            <button key={a.key} onClick={() => setAba(a.key)}
              className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${aba === a.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {a.label}
            </button>
          ))}
        </div>

        {/* ── Unidades ────────────────────────────────────────────── */}
        {aba === 'unidades' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">{unidadesPadaria.length} unidade{unidadesPadaria.length !== 1 ? 's' : ''} cadastrada{unidadesPadaria.length !== 1 ? 's' : ''}</span>
              <BtnNovo label="Nova Unidade" onClick={() => abrirNovo('unidade')} />
            </div>
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
                  <button onClick={() => abrirEditar('unidade', u)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Editar">
                    <Pencil size={14} />
                  </button>
                </div>
                <div className="space-y-1.5 text-xs text-gray-600">
                  <p><span className="text-gray-400 font-medium">CNPJ:</span> {u.cnpj || <span className="text-gray-300 italic">não informado</span>}</p>
                  <p><span className="text-gray-400 font-medium">Endereço:</span> {u.endereco || <span className="text-gray-300 italic">não informado</span>}</p>
                  <p><span className="text-gray-400 font-medium">Responsável:</span> {u.responsavel || <span className="text-gray-300 italic">não informado</span>}</p>
                </div>
              </div>
            ))}
          </div>
          </div>
        )}

        {/* ── Produtos ────────────────────────────────────────────── */}
        {aba === 'produtos' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Produtos — {produtos.length} cadastrados</span>
              <BtnNovo label="Novo" onClick={() => abrirNovo('produto')} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Nome','Categoria','Unidade',''].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {produtos.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{p.nome}</td>
                      <td className="px-4 py-3 text-gray-600">{p.categoria}</td>
                      <td className="px-4 py-3"><span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded">{p.unidade || '—'}</span></td>
                      <td className="px-4 py-3">
                        <BtnAcoes onEdit={() => abrirEditar('produto', p)} onDel={() => setConfirmDel({ tipo: 'produto', id: p.id, nome: p.nome })} />
                      </td>
                    </tr>
                  ))}
                  {produtos.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">Nenhum produto cadastrado.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Fornecedores ─────────────────────────────────────────── */}
        {aba === 'fornecedores' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Fornecedores — {fornecedores.length} cadastrados</span>
              <BtnNovo label="Novo" onClick={() => abrirNovo('fornecedor')} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Nome','Categoria',''].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {fornecedores.map((f) => (
                    <tr key={f.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{f.nome}</td>
                      <td className="px-4 py-3 text-gray-600">{f.categoria}</td>
                      <td className="px-4 py-3">
                        <BtnAcoes onEdit={() => abrirEditar('fornecedor', f)} onDel={() => setConfirmDel({ tipo: 'fornecedor', id: f.id, nome: f.nome })} />
                      </td>
                    </tr>
                  ))}
                  {fornecedores.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-sm">Nenhum fornecedor cadastrado.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Categorias de Compras ─────────────────────────────────── */}
        {aba === 'cat-compras' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Categorias de Compras — {categoriasCompra.length} cadastradas</span>
              <BtnNovo label="Nova" onClick={() => abrirNovo('cat-compra')} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Nome','',''].map((h, i) => (
                      <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {categoriasCompra.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{c.nome}</td>
                      <td className="px-4 py-3"><span className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-full ring-1 ring-blue-600/20">Compras</span></td>
                      <td className="px-4 py-3">
                        <BtnAcoes onEdit={() => abrirEditar('cat-compra', c)} onDel={() => setConfirmDel({ tipo: 'cat-compra', id: c.id, nome: c.nome })} />
                      </td>
                    </tr>
                  ))}
                  {categoriasCompra.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-sm">Nenhuma categoria cadastrada.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Categorias de Boletos ─────────────────────────────────── */}
        {aba === 'cat-boletos' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-gray-900">Categorias de Boletos — {categoriasBoleto.length} principais</span>
                <p className="text-xs text-gray-400 mt-0.5">Clique numa categoria para ver subcategorias</p>
              </div>
              <BtnNovo label="Nova" onClick={() => abrirNovo('cat-boleto')} />
            </div>
            <div className="divide-y divide-gray-100">
              {categoriasBoleto.map((cat) => (
                <div key={cat.id}>
                  <div className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <button onClick={() => setCatExpand(catExpand === cat.id ? null : cat.id)} className="flex items-center gap-3 flex-1 text-left">
                      <span className={`w-1.5 h-5 rounded-full ${catExpand === cat.id ? 'bg-amber-500' : 'bg-gray-300'}`} />
                      <span className="text-sm font-semibold text-gray-900">{cat.nome}</span>
                      <span className="text-xs text-gray-400">{cat.subcategorias.length} subcategorias</span>
                      <span className="text-gray-400 text-xs ml-1">{catExpand === cat.id ? '▲' : '▼'}</span>
                    </button>
                    <BtnAcoes onEdit={() => abrirEditar('cat-boleto', cat)} onDel={() => setConfirmDel({ tipo: 'cat-boleto', id: cat.id, nome: cat.nome })} />
                  </div>
                  {catExpand === cat.id && (
                    <div className="px-5 pb-4 pl-10">
                      <div className="flex flex-wrap gap-2">
                        {cat.subcategorias.map((sub: string) => (
                          <span key={sub} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">{sub}</span>
                        ))}
                        {cat.subcategorias.length === 0 && <span className="text-xs text-gray-400 italic">Sem subcategorias</span>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {categoriasBoleto.length === 0 && <div className="px-5 py-8 text-center text-gray-400 text-sm">Nenhuma categoria cadastrada.</div>}
            </div>
          </div>
        )}

        {/* ── Unidades de Medida ────────────────────────────────────── */}
        {aba === 'unid-medida' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Unidades de Medida — {unidades.length} cadastradas</span>
              <BtnNovo label="Nova" onClick={() => abrirNovo('unid-medida')} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Sigla','Descrição',''].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {unidades.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3"><span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-1 rounded">{u.sigla}</span></td>
                      <td className="px-4 py-3 text-gray-700">{u.descricao}</td>
                      <td className="px-4 py-3">
                        <BtnAcoes onEdit={() => abrirEditar('unid-medida', u)} onDel={() => setConfirmDel({ tipo: 'unid-medida', id: u.id, nome: u.sigla })} />
                      </td>
                    </tr>
                  ))}
                  {unidades.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-sm">Nenhuma unidade de medida cadastrada.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Formas de Pagamento ───────────────────────────────────── */}
        {aba === 'pagamento' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-gray-900">Formas de Pagamento Aceitas</span>
                  <p className="text-xs text-gray-400 mt-0.5">Gerencie quais formas aparecem nos lançamentos de faturamento</p>
                </div>
                <button onClick={() => setAdicionando(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#D97706' }}>
                  <Plus size={14} /> Nova Forma
                </button>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {formas.map((f) => (
                  <div key={f.id} className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${f.ativo ? 'border-gray-200 bg-white' : 'border-dashed border-gray-200 bg-gray-50 opacity-60'}`}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${f.cor}20` }}>
                      <CreditCard size={16} style={{ color: f.cor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{f.nome}</p>
                      <p className="text-xs text-gray-400">{f.ativo ? 'Ativo' : 'Inativo'}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleForma(f.id)} title={f.ativo ? 'Desativar' : 'Ativar'}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${f.ativo ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                        <Check size={14} />
                      </button>
                      <button onClick={() => removerForma(f.id)} title="Remover"
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {adicionando && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-blue-900 mb-4 flex items-center gap-2"><CreditCard size={15} /> Adicionar nova forma de pagamento</h3>
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Nome</label>
                    <input type="text" value={novaForma} onChange={(e) => setNovaForma(e.target.value)} placeholder="Ex: Hipercard, Vale Alimentação…"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Cor</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {CORES_PRESET.map((cor) => (
                        <button key={cor} onClick={() => setNovaCor(cor)}
                          className={`w-7 h-7 rounded-full border-2 transition-all ${novaCor === cor ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: cor }} />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { if (novaForma.trim()) { adicionarForma(novaForma.trim(), novaCor); setNovaForma(''); setNovaCor('#10B981'); setAdicionando(false); } }}
                      className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#D97706' }}>Salvar</button>
                    <button onClick={() => { setAdicionando(false); setNovaForma(''); }}
                      className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 bg-white">Cancelar</button>
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-400 px-1">
              <Check size={12} className="text-emerald-500" />
              <span>As formas <strong className="text-gray-600">ativas</strong> aparecem automaticamente nos lançamentos de faturamento.</span>
            </div>
          </div>
        )}

        {/* ── Metas ─────────────────────────────────────────────────── */}
        {aba === 'metas' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2"><Target size={15} className="text-amber-600" /><span className="text-sm font-semibold text-gray-900">Metas de Faturamento</span></div>
                <div className="flex items-center gap-2 flex-wrap">
                  <select value={anoFat} onChange={(e) => { setAnoFat(Number(e.target.value)); setSavedFat(false); setDraftFat({}); }} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white">
                    {[2024,2025,2026,2027].map((a) => <option key={a}>{a}</option>)}
                  </select>
                  <select value={unidFat} onChange={(e) => { setUnidFat(e.target.value as 'todas'|'1'|'2'); setSavedFat(false); setDraftFat({}); }} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white">
                    {UNIDADES_OPT.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                  </select>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th><th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-56">Meta (R$)</th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {TIPOS_FAT.map(({ tipo, label }) => (
                    <tr key={tipo} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-700 font-medium">{label}</td>
                      <td className="px-5 py-3"><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">R$</span><input type="number" min={0} step={100} value={getValFat(tipo)} onChange={(e) => setValFat(tipo, e.target.value)} className="w-full pl-8 pr-3 py-2 text-sm text-right border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 tabular-nums" /></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                {savedFat ? <span className="text-xs text-emerald-600 flex items-center gap-1"><Check size={12} /> Salvo</span> : <span />}
                <button onClick={handleSalvarFat} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#D97706' }}><Save size={13} /> Salvar Metas de Faturamento</button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2"><Target size={15} className="text-red-500" /><span className="text-sm font-semibold text-gray-900">Metas de Despesa</span><span className="text-xs text-gray-400">— % do faturamento</span></div>
                <div className="flex items-center gap-2">
                  <select value={anoDesp} onChange={(e) => { setAnoDesp(Number(e.target.value)); setSavedDesp(false); setDraftDesp({}); }} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white">{[2024,2025,2026,2027].map((a) => <option key={a}>{a}</option>)}</select>
                  <select value={unidDesp} onChange={(e) => { setUnidDesp(e.target.value as 'todas'|'1'|'2'); setSavedDesp(false); setDraftDesp({}); }} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white">{UNIDADES_OPT.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}</select>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Categoria DRE</th><th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase w-44">Máximo (%)</th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {DEFAULT_DESP.map((d) => (
                    <tr key={d.categoriaKey} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-700 font-medium">{d.categoriaNome}</td>
                      <td className="px-5 py-3"><div className="flex items-center gap-2 justify-end"><input type="number" min={0} max={100} step={0.5} value={getValDesp(d.categoriaKey)} onChange={(e) => setValDesp(d.categoriaKey, e.target.value)} className="w-24 px-3 py-2 text-sm text-right border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 tabular-nums" /><span className="text-gray-400 text-sm">%</span></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                <p className="text-xs text-gray-400">% máximo do faturamento por categoria</p>
                <div className="flex items-center gap-3">{savedDesp && <span className="text-xs text-emerald-600 flex items-center gap-1"><Check size={12} /> Salvo</span>}<button onClick={handleSalvarDesp} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#D97706' }}><Save size={13} /> Salvar Metas de Despesa</button></div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2"><Target size={15} className="text-emerald-600" /><span className="text-sm font-semibold text-gray-900">Metas de Lucro</span></div>
                <div className="flex items-center gap-2 flex-wrap">
                  <select value={anoLucro} onChange={(e) => { setAnoLucro(Number(e.target.value)); setSavedLucro(false); setDraftLucro({}); }} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white">{[2024,2025,2026,2027].map((a) => <option key={a}>{a}</option>)}</select>
                  <select value={unidLucro} onChange={(e) => { setUnidLucro(e.target.value as 'todas'|'1'|'2'); setSavedLucro(false); setDraftLucro({}); }} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white">{UNIDADES_OPT.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}</select>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Tipo</th><th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase w-56">Meta (R$)</th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {TIPOS_LUCRO.map(({ tipo, label }) => (
                    <tr key={tipo} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-700 font-medium">{label}</td>
                      <td className="px-5 py-3"><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">R$</span><input type="number" min={0} step={100} value={getValLucro(tipo)} onChange={(e) => setValLucro(tipo, e.target.value)} className="w-full pl-8 pr-3 py-2 text-sm text-right border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 tabular-nums" /></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                {savedLucro ? <span className="text-xs text-emerald-600 flex items-center gap-1"><Check size={12} /> Salvo</span> : <span />}
                <button onClick={handleSalvarLucro} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#D97706' }}><Save size={13} /> Salvar Metas de Lucro</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Modal de Cadastro / Edição ─────────────────────────────── */}
      <Modal open={modalTipo !== null} onClose={() => setModalTipo(null)} title={modalTitle(modalTipo, !!editandoItem)} size="md">
        <div className="space-y-4">

          {/* Produto */}
          {modalTipo === 'produto' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Nome do produto *</label>
                <input autoFocus type="text" value={fNome} onChange={(e) => setFNome(e.target.value)} placeholder="Ex: Farinha de Trigo"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Categoria</label>
                  <select value={fCat} onChange={(e) => setFCat(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                    {CATEGORIAS_PRODUTO.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Unidade de Medida</label>
                  <select value={fUnidade} onChange={(e) => setFUnidade(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                    {['KG','L','UN','DZ','CX','PC','MACO'].map((u) => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Fornecedor */}
          {modalTipo === 'fornecedor' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Nome do fornecedor *</label>
                <input autoFocus type="text" value={fNome} onChange={(e) => setFNome(e.target.value)} placeholder="Ex: Moinho Taquariense"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Categoria</label>
                <select value={fCat} onChange={(e) => setFCat(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                  {CATEGORIAS_FORN.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </>
          )}

          {/* Categoria de Compra */}
          {modalTipo === 'cat-compra' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Nome da categoria *</label>
              <input autoFocus type="text" value={fNome} onChange={(e) => setFNome(e.target.value)} placeholder="Ex: Laticínios"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
          )}

          {/* Categoria de Boleto */}
          {modalTipo === 'cat-boleto' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Nome da categoria *</label>
                <input autoFocus type="text" value={fNome} onChange={(e) => setFNome(e.target.value)} placeholder="Ex: Manutenção"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Subcategorias</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {fSubs.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                      {s}
                      <button onClick={() => setFSubs(fSubs.filter((x) => x !== s))} className="text-amber-500 hover:text-amber-800"><X size={10} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={fSubNova} onChange={(e) => setFSubNova(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && fSubNova.trim()) { setFSubs([...fSubs, fSubNova.trim()]); setFSubNova(''); } }}
                    placeholder="Digite e pressione Enter"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  <button onClick={() => { if (fSubNova.trim()) { setFSubs([...fSubs, fSubNova.trim()]); setFSubNova(''); } }}
                    className="px-3 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#D97706' }}>
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Unidade de Medida */}
          {modalTipo === 'unid-medida' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Sigla *</label>
                <input autoFocus type="text" value={fSigla} onChange={(e) => setFSigla(e.target.value.toUpperCase())} placeholder="Ex: KG, L, UN"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Descrição</label>
                <input type="text" value={fDescricao} onChange={(e) => setFDescricao(e.target.value)} placeholder="Ex: Quilograma"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
            </>
          )}

          {/* Unidade da Padaria (Novo ou Editar) */}
          {modalTipo === 'unidade' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Nome da unidade *</label>
                <input autoFocus type="text" value={fNome} onChange={(e) => setFNome(e.target.value)} placeholder="Ex: Unidade Centro"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">CNPJ</label>
                <input type="text" value={fCnpj} onChange={(e) => setFCnpj(e.target.value)} placeholder="00.000.000/0001-00"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Endereço</label>
                <input type="text" value={fEndereco} onChange={(e) => setFEndereco(e.target.value)} placeholder="Rua, número, bairro"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Responsável</label>
                <input type="text" value={fResponsavel} onChange={(e) => setFResponsavel(e.target.value)} placeholder="Nome do responsável"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
            </>
          )}

          {erroModal && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{erroModal}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button onClick={() => setModalTipo(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={handleSalvar} disabled={salvandoModal}
              className="px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60" style={{ backgroundColor: '#D97706' }}>
              {salvandoModal ? 'Salvando…' : editandoItem ? 'Salvar Alterações' : 'Cadastrar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Modal de Confirmação de Exclusão ────────────────────────── */}
      <Modal open={confirmDel !== null} onClose={() => setConfirmDel(null)} title="Confirmar Exclusão" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-lg p-3">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">
              Deseja excluir <strong>{confirmDel?.nome}</strong>? Esta ação não pode ser desfeita.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button onClick={() => setConfirmDel(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={handleDeletar} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">Excluir</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
