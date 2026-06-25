'use client';

import { useState, useMemo, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { curvaABC, categoriasBoleto } from '@/lib/mock-data';
import { formatCurrency, formatPercent, calcPercent, calcVariation } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { useMetas, DEFAULT_DESP } from '@/contexts/MetasContext';
import { useDateRange } from '@/contexts/DateRangeContext';
import { MetaGauge } from '@/components/ui/MetaGauge';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, TrendingDown, ChevronRight, ChevronDown,
  AlertTriangle, DollarSign, ShoppingBag, Link2, Target,
} from 'lucide-react';
import type { DREMes } from '@/types';


// ── Mock: histórico de preços para alerta (2i) ────────────────
const alertasPreco = [
  {
    produto: 'Farinha de Trigo', fornecedor: 'Moinho Taquariense',
    precoAnterior: 4.20, precoAtual: 4.80,
    historico: [
      { mes: 'Jan', preco: 3.80 }, { mes: 'Fev', preco: 3.90 },
      { mes: 'Mar', preco: 4.10 }, { mes: 'Abr', preco: 4.20 },
      { mes: 'Mai', preco: 4.50 }, { mes: 'Jun', preco: 4.80 },
    ],
  },
  {
    produto: 'Margarina Industrial', fornecedor: 'Casa do Panificador',
    precoAnterior: 16.50, precoAtual: 18.50,
    historico: [
      { mes: 'Jan', preco: 14.00 }, { mes: 'Fev', preco: 14.50 },
      { mes: 'Mar', preco: 15.00 }, { mes: 'Abr', preco: 16.00 },
      { mes: 'Mai', preco: 16.50 }, { mes: 'Jun', preco: 18.50 },
    ],
  },
  {
    produto: 'Chocolate Cobertura', fornecedor: 'Baristo',
    precoAnterior: 28.00, precoAtual: 32.00,
    historico: [
      { mes: 'Jan', preco: 24.00 }, { mes: 'Fev', preco: 25.00 },
      { mes: 'Mar', preco: 26.00 }, { mes: 'Abr', preco: 27.00 },
      { mes: 'Mai', preco: 28.00 }, { mes: 'Jun', preco: 32.00 },
    ],
  },
];

// ── Linhas da DRE com mapeamento para categoriasBoleto ────────
type DRENumKey = Exclude<keyof DREMes, 'mes'>;
const dreLinhas: { key: DRENumKey; label: string; catNome?: string }[] = [
  { key: 'compraInsumos',  label: 'Compra de Insumos',  catNome: 'Compra de Insumos' },
  { key: 'folhaPagamento', label: 'Folha de Pagamento', catNome: 'Folha de Pagamento' },
  { key: 'impostos',       label: 'Impostos',           catNome: 'Impostos' },
  { key: 'despesasAdm',    label: 'Despesas ADM',       catNome: 'Despesas ADM' },
  { key: 'manutencao',     label: 'Manutenção',         catNome: 'Manutenção' },
  { key: 'investimento',   label: 'Investimento',       catNome: 'Investimento' },
  { key: 'proLabore',      label: 'Pró Labore' },
  { key: 'retiraSocio',    label: 'Retira Sócio' },
];

const PIE_COLORS = ['#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6', '#10B981', '#F97316', '#EC4899'];

function pct(v: number, ref: number) { return ref > 0 ? (v / ref) * 100 : 0; }

function distribuirSubs(total: number, subs: string[]) {
  if (!subs.length) return [];
  const pesos = subs.map((_, i) => Math.max(1, subs.length - i));
  const totalP = pesos.reduce((a, b) => a + b, 0);
  return subs.map((nome, i) => ({ nome, valor: Math.round((total * pesos[i] / totalP) * 10) / 10 }));
}

// ── Componente de card KPI ────────────────────────────────────
function KpiIndicador({
  label, value, prev, color, icon,
}: {
  label: string; value: number; prev: number;
  color: string; icon: React.ReactNode;
}) {
  const variation = calcVariation(value, prev);
  const up        = variation >= 0;
  const VarIcon   = up ? TrendingUp : TrendingDown;
  const varColor  = up ? 'text-emerald-600' : 'text-red-600';
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
      </div>
      <p className="text-[1.625rem] leading-none font-display italic text-gray-900 mb-1">{formatCurrency(value)}</p>
      <div className={`flex items-center gap-1 text-xs ${varColor}`}>
        <VarIcon size={12} />
        <span className="font-medium">{up ? '+' : ''}{formatPercent(variation)}</span>
        <span className="text-gray-400 ml-1">vs mês anterior</span>
      </div>
    </div>
  );
}

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function mapDre(row: any): DREMes {
  return {
    mes: MESES[row.mes] ?? String(row.mes),
    faturamentoTotal: Number(row.faturamento_total) || 0,
    faturamentoReal:  Number(row.faturamento_real)  || 0,
    compraInsumos:    Number(row.compra_insumos)    || 0,
    folhaPagamento:   Number(row.folha_pagamento)   || 0,
    impostos:         Number(row.impostos)          || 0,
    despesasAdm:      Number(row.despesas_adm)      || 0,
    manutencao:       Number(row.manutencao)        || 0,
    investimento:     Number(row.investimento)      || 0,
    proLabore:        Number(row.pro_labore)        || 0,
    retiraSocio:      Number(row.retira_socio)      || 0,
    despesasTotal:    Number(row.despesas_total)    || 0,
    lucro:            Number(row.lucro)             || 0,
  };
}

const EMPTY_DRE: DREMes = {
  mes: '—', faturamentoTotal: 0, faturamentoReal: 0, compraInsumos: 0,
  folhaPagamento: 0, impostos: 0, despesasAdm: 0, manutencao: 0,
  investimento: 0, proLabore: 0, retiraSocio: 0, despesasTotal: 0, lucro: 0,
};

export default function IndicadoresPage() {
  const { filtroUnidade } = useUnit();
  const { getMetaDesp, getMetaLucro, getMetaFat } = useMetas();
  const { mesInicio, mesFim, ano: anoRange } = useDateRange();
  const [dreExpanded, setDreExpanded] = useState<Set<string>>(new Set());
  const [alertaAberto, setAlertaAberto]  = useState<string | null>(null);

  // ── Carrega dados reais do Supabase ────────────────────────────
  const [dreDB, setDreDB]             = useState<any[]>([]);
  const [fatDiarioDB, setFatDiarioDB] = useState<any[]>([]);
  const [boletosDB, setBoletosDB]     = useState<any[]>([]);
  const [comprasDB, setComprasDB]     = useState<any[]>([]);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('dre_mensal').select('*').order('ano').order('mes'),
      supabase.from('faturamento_diario').select('*').order('data'),
      supabase.from('boletos').select('categoria,sub_categoria,valor,unidade_id,vencimento,status'),
      supabase.from('compras').select('categoria,valor_total,unidade_id,data'),
    ]).then(([{ data: dre }, { data: fat }, { data: bol }, { data: cpr }]) => {
      setDreDB(dre || []);
      setFatDiarioDB(fat || []);
      setBoletosDB(bol || []);
      setComprasDB(cpr || []);
    });
  }, []);

  // Deriva arrays no mesmo formato que antes (camelCase)
  const dreU1Rows = dreDB.filter(r => r.unidade_id === '1');
  const dreU2Rows = dreDB.filter(r => r.unidade_id === '2');

  const dreMensalU1: DREMes[] = dreU1Rows.map(mapDre);
  const dreMensalU2: DREMes[] = dreU2Rows.map(mapDre);

  const dreMensal: DREMes[] = dreU1Rows.map((row, i) => {
    const u2 = dreU2Rows[i];
    const u1m = mapDre(row);
    if (!u2) return u1m;
    const u2m = mapDre(u2);
    return {
      mes: u1m.mes,
      faturamentoTotal: u1m.faturamentoTotal + u2m.faturamentoTotal,
      faturamentoReal:  u1m.faturamentoReal  + u2m.faturamentoReal,
      compraInsumos:    u1m.compraInsumos    + u2m.compraInsumos,
      folhaPagamento:   u1m.folhaPagamento   + u2m.folhaPagamento,
      impostos:         u1m.impostos         + u2m.impostos,
      despesasAdm:      u1m.despesasAdm      + u2m.despesasAdm,
      manutencao:       u1m.manutencao       + u2m.manutencao,
      investimento:     u1m.investimento     + u2m.investimento,
      proLabore:        u1m.proLabore        + u2m.proLabore,
      retiraSocio:      u1m.retiraSocio      + u2m.retiraSocio,
      despesasTotal:    u1m.despesasTotal    + u2m.despesasTotal,
      lucro:            u1m.lucro            + u2m.lucro,
    };
  });

  const dreAtualU1     = dreMensalU1.at(-1)  ?? EMPTY_DRE;
  const dreAtualU2     = dreMensalU2.at(-1)  ?? EMPTY_DRE;
  const dreAtual       = dreMensal.at(-1)    ?? EMPTY_DRE;
  const dreMesAnterior = dreMensal.at(-2)    ?? EMPTY_DRE;

  // Adapta faturamento_diario para o formato camelCase esperado pelo display
  const faturamentoDiario = fatDiarioDB.map((d: any) => ({
    data: d.data,
    unidadeId: d.unidade_id,
    valor: Number(d.valor) || 0,
  }));

  const dreBase: DREMes   = filtroUnidade === '1' ? dreAtualU1 : filtroUnidade === '2' ? dreAtualU2 : dreAtual;
  const drePrev: DREMes   = filtroUnidade === '1' ? (dreMensalU1.at(-2) ?? EMPTY_DRE) : filtroUnidade === '2' ? (dreMensalU2.at(-2) ?? EMPTY_DRE) : dreMesAnterior;
  const dreMensalBase     = filtroUnidade === '1' ? dreMensalU1 : filtroUnidade === '2' ? dreMensalU2 : dreMensal;

  // 2b — faturamento diário por unidade (respeita filtro de período completo)
  const dadosDiarios = useMemo(() => {
    const isMultiMes = mesFim > mesInicio;
    const datas = [...new Set(faturamentoDiario.map(f => f.data))]
      .filter(data => {
        const [y, m] = data.split('-').map(Number);
        return y === anoRange && (m - 1) >= mesInicio && (m - 1) <= mesFim;
      })
      .sort();
    return datas.map(data => {
      const u1 = faturamentoDiario.find(f => f.data === data && f.unidadeId === '1');
      const u2 = faturamentoDiario.find(f => f.data === data && f.unidadeId === '2');
      const [, m, d] = data.split('-').map(Number);
      const label = isMultiMes
        ? `${String(d).padStart(2, '0')}/${MESES[m - 1]}`
        : String(d).padStart(2, '0');
      const row: Record<string, unknown> = { dia: label };
      if (filtroUnidade !== '2') row.Centro = u1?.valor ?? 0;
      if (filtroUnidade !== '1') row.Bairro  = u2?.valor ?? 0;
      return row;
    });
  }, [filtroUnidade, faturamentoDiario, mesInicio, mesFim, anoRange]);

  const periodoLabelDiario = mesInicio === mesFim
    ? `${MESES[mesInicio]} ${anoRange}`
    : `${MESES[mesInicio]}–${MESES[mesFim]} ${anoRange}`;
  const tickIntervalDiario = dadosDiarios.length > 60
    ? Math.ceil(dadosDiarios.length / 15) - 1
    : dadosDiarios.length > 31 ? 6 : 1;

  // 2c — média por dia da semana
  const mediaSemanal = useMemo(() => {
    const nomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const g: Record<number, { c: number[]; b: number[] }> = {};
    for (let i = 0; i < 7; i++) g[i] = { c: [], b: [] };
    faturamentoDiario.forEach(f => {
      if (f.valor <= 0) return;
      const dow = new Date(f.data + 'T12:00:00').getDay();
      if (f.unidadeId === '1' && filtroUnidade !== '2') g[dow].c.push(f.valor);
      if (f.unidadeId === '2' && filtroUnidade !== '1') g[dow].b.push(f.valor);
    });
    return nomes.map((dia, i) => {
      const row: Record<string, unknown> = { dia };
      if (filtroUnidade !== '2') row.Centro = g[i].c.length ? Math.round(g[i].c.reduce((a, b) => a + b, 0) / g[i].c.length) : 0;
      if (filtroUnidade !== '1') row.Bairro  = g[i].b.length ? Math.round(g[i].b.reduce((a, b) => a + b, 0) / g[i].b.length) : 0;
      return row;
    });
  }, [filtroUnidade, faturamentoDiario]);

  // 2d — comparativo anual (ano anterior estimado como ~85% do atual)
  const comparativoU1 = dreMensalU1.map((d, i) => ({ mes: d.mes, '2026': d.faturamentoTotal, '2025': Math.round(d.faturamentoTotal * (0.84 + i * 0.01)) }));
  const comparativoU2 = dreMensalU2.map((d, i) => ({ mes: d.mes, '2026': d.faturamentoTotal, '2025': Math.round(d.faturamentoTotal * (0.83 + i * 0.012)) }));

  const lastU1 = dreMensalU1.at(-1);
  const lastU2 = dreMensalU2.at(-1);
  const crescU1 = lastU1 ? calcPercent(lastU1.faturamentoTotal - (comparativoU1.at(-1)?.['2025'] ?? 0), comparativoU1.at(-1)?.['2025'] ?? 1) : 0;
  const crescU2 = lastU2 ? calcPercent(lastU2.faturamentoTotal - (comparativoU2.at(-1)?.['2025'] ?? 0), comparativoU2.at(-1)?.['2025'] ?? 1) : 0;

  // 2e — evolução combinada faturamento + despesas + lucro
  const evolucao = dreMensalBase.map(d => ({
    mes: d.mes, Faturamento: d.faturamentoTotal, Despesas: d.despesasTotal, Lucro: d.lucro,
  }));

  // 2g — pizza despesas por categoria
  const pieData = [
    { name: 'Insumos',   value: dreBase.compraInsumos },
    { name: 'Folha',     value: dreBase.folhaPagamento },
    { name: 'Impostos',  value: dreBase.impostos },
    { name: 'ADM',       value: dreBase.despesasAdm },
    { name: 'Manutenção',value: dreBase.manutencao },
    { name: 'Pró Labore',value: dreBase.proLabore },
    { name: 'Sócio',     value: dreBase.retiraSocio },
  ].filter(d => d.value > 0);

  // 2h — curva ABC apenas A e B
  const abAB = curvaABC.filter(x => x.classe !== 'C');

  // Meses inteiros (0-11) presentes na base filtrada por unidade
  const dreBaseRows = filtroUnidade === '2' ? dreU2Rows : dreU1Rows;
  const mesesBase: number[] = dreBaseRows.map(r => Number(r.mes));

  function getSubcatsReais(catKey: string, catNome: string): { nome: string; porMes: number[]; total: number }[] {
    const items: { sub: string; mes: number; val: number }[] = [];

    if (catKey === 'compraInsumos') {
      const fonte = filtroUnidade !== 'todas'
        ? comprasDB.filter(c => c.unidade_id === filtroUnidade)
        : comprasDB;
      for (const c of fonte) {
        const mes = new Date((c.data as string) + 'T12:00:00').getMonth();
        if (!mesesBase.includes(mes)) continue;
        items.push({ sub: c.categoria || 'Outros', mes, val: Number(c.valor_total) || 0 });
      }
    } else {
      const fonte = filtroUnidade !== 'todas'
        ? boletosDB.filter(b => b.unidade_id === filtroUnidade)
        : boletosDB;
      for (const b of fonte.filter(b => b.categoria === catNome)) {
        const mes = new Date((b.vencimento as string) + 'T12:00:00').getMonth();
        if (!mesesBase.includes(mes)) continue;
        items.push({ sub: b.sub_categoria || 'Outros', mes, val: Number(b.valor) || 0 });
      }
    }

    const grouped: Record<string, Record<number, number>> = {};
    for (const { sub, mes, val } of items) {
      if (!grouped[sub]) grouped[sub] = {};
      grouped[sub][mes] = (grouped[sub][mes] || 0) + val;
    }

    return Object.entries(grouped)
      .map(([nome, byMes]) => {
        const porMes = mesesBase.map(m => byMes[m] || 0);
        const total = porMes.reduce((a, b) => a + b, 0);
        return { nome, porMes, total };
      })
      .filter(s => s.total > 0)
      .sort((a, b) => b.total - a.total);
  }

  function toggleDre(key: string) {
    setDreExpanded(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  return (
    <>
      <Header title="Indicadores" />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ── 2a: Cards KPI ──────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Resumo do período — Junho 2026</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiIndicador label="Faturamento" value={dreBase.faturamentoTotal} prev={drePrev.faturamentoTotal} color="bg-amber-50"   icon={<DollarSign size={18} className="text-amber-600" />} />
            <KpiIndicador label="Despesas"    value={dreBase.despesasTotal}    prev={drePrev.despesasTotal}    color="bg-red-50"     icon={<TrendingDown size={18} className="text-red-500" />} />
            <KpiIndicador label="Lucro"       value={dreBase.lucro}            prev={drePrev.lucro}            color="bg-emerald-50" icon={<DollarSign size={18} className="text-emerald-600" />} />
            <KpiIndicador label="CMV"         value={dreBase.compraInsumos}    prev={drePrev.compraInsumos}    color="bg-blue-50"    icon={<ShoppingBag size={18} className="text-blue-600" />} />
          </div>
        </section>

        {/* ── 2b: Faturamento diário por unidade ────────────── */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Faturamento Diário — {periodoLabelDiario}</h2>
          <p className="text-xs text-gray-400 mb-4">Uma linha por unidade · dias sem movimento aparecem como zero</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dadosDiarios} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="dia" tick={{ fontSize: 10 }} interval={tickIntervalDiario} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} width={48} />
              <Tooltip formatter={(v) => typeof v === 'number' ? formatCurrency(v) : v} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              {filtroUnidade !== '2' && <Line type="monotone" dataKey="Centro" stroke="#D97706" strokeWidth={2} dot={{ r: 3 }} />}
              {filtroUnidade !== '1' && <Line type="monotone" dataKey="Bairro"  stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />}
            </LineChart>
          </ResponsiveContainer>
        </section>

        {/* ── 2c: Média semanal por unidade ─────────────────── */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Média de Faturamento por Dia da Semana</h2>
          <p className="text-xs text-gray-400 mb-4">Média calculada sobre os dias do período com movimento registrado</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mediaSemanal} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(1)}k`} width={52} />
              <Tooltip formatter={(v) => typeof v === 'number' ? formatCurrency(v) : v} />
              <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              {filtroUnidade !== '2' && <Bar dataKey="Centro" fill="#D97706" radius={[4, 4, 0, 0]} />}
              {filtroUnidade !== '1' && <Bar dataKey="Bairro"  fill="#3B82F6" radius={[4, 4, 0, 0]} />}
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* ── 2d: Comparativo Anual 2025 vs 2026 ────────────── */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Comparativo Anual — Faturamento 2025 × 2026</h2>
          <div className={`grid gap-4 ${filtroUnidade === 'todas' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
            {(filtroUnidade === 'todas' || filtroUnidade === '1') && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold text-amber-700">Unidade Centro</h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${crescU1 >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {crescU1 >= 0 ? '+' : ''}{formatPercent(crescU1)} crescimento Jun
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={comparativoU1} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} width={40} />
                    <Tooltip formatter={(v) => typeof v === 'number' ? formatCurrency(v) : v} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="2025" fill="#FDE68A" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="2026" fill="#D97706" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {(filtroUnidade === 'todas' || filtroUnidade === '2') && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold text-blue-700">Unidade Bairro</h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${crescU2 >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {crescU2 >= 0 ? '+' : ''}{formatPercent(crescU2)} crescimento Jun
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={comparativoU2} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} width={40} />
                    <Tooltip formatter={(v) => typeof v === 'number' ? formatCurrency(v) : v} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="2025" fill="#BFDBFE" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="2026" fill="#3B82F6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>

        {/* ── 2e: Faturamento + Despesas + Lucro combinado ──── */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Evolução: Faturamento, Despesas e Lucro</h2>
          <p className="text-xs text-gray-400 mb-4">Jan–Jun 2026 · três linhas no mesmo gráfico</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={evolucao} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} width={52} />
              <Tooltip formatter={(v) => typeof v === 'number' ? formatCurrency(v) : v} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Faturamento" stroke="#D97706" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="Despesas"    stroke="#EF4444" strokeWidth={2}   dot={false} />
              <Line type="monotone" dataKey="Lucro"       stroke="#10B981" strokeWidth={2}   dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </section>

        {/* ── 2f: DRE Acumulado Jan→Mês Atual ───────────────── */}
        {/* REGRA: este bloco ignora o filtro de data — responde APENAS ao filtro de unidade */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                DRE — Acumulado 2026 (Jan – {dreMensalBase.at(-1)?.mes ?? 'Jun'})
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Período fixo: janeiro até o mês atual · clique em uma linha para ver subcategorias do acumulado
              </p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full border
              bg-blue-50 text-blue-700 border-blue-200">
              {filtroUnidade === '1' ? 'Centro' : filtroUnidade === '2' ? 'Bairro' : 'Consolidado'}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: `${200 + dreMensalBase.length * 112 + 128 + 90}px` }}>
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide" style={{ minWidth: 200 }}>Linha DRE</th>
                  {dreMensalBase.map(m => (
                    <th key={m.mes} className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide" style={{ minWidth: 110 }}>{m.mes}</th>
                  ))}
                  <th className="text-right px-5 py-2.5 text-xs font-semibold text-amber-700 uppercase tracking-wide bg-amber-50/60" style={{ minWidth: 128 }}>Acumulado</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide" style={{ minWidth: 88 }}>Meta %</th>
                </tr>
              </thead>
              <tbody>
                {/* Faturamento */}
                <tr className="border-b border-gray-100 bg-amber-50">
                  <td className="px-5 py-3 font-bold text-gray-900">Faturamento Total</td>
                  {dreMensalBase.map(m => {
                    const unidKey = filtroUnidade === '1' ? '1' : filtroUnidade === '2' ? '2' : 'todas';
                    const metaFat = getMetaFat('mensal', anoRange, unidKey);
                    const pctFat = metaFat > 0 ? (m.faturamentoTotal / metaFat) * 100 : null;
                    const cor = pctFat === null ? null : pctFat >= 100 ? 'text-emerald-600' : pctFat >= 85 ? 'text-amber-600' : 'text-red-600';
                    return (
                      <td key={m.mes} className="px-3 py-3 text-right font-medium text-gray-800 tabular-nums text-xs whitespace-nowrap">
                        {formatCurrency(m.faturamentoTotal)}
                        {cor && pctFat !== null && (
                          <span className={`block text-[9px] font-semibold leading-none mt-0.5 ${cor}`}>
                            {pctFat >= 100 ? '✓' : '↓'} {pctFat.toFixed(0)}% meta
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-5 py-3 text-right font-bold text-amber-700 tabular-nums bg-amber-50/60 whitespace-nowrap">
                    {formatCurrency(dreMensalBase.reduce((a, m) => a + m.faturamentoTotal, 0))}
                  </td>
                  <td className="px-3 py-3 text-center text-gray-300 text-xs">—</td>
                </tr>
                {/* Despesas linha a linha */}
                {dreLinhas.map(linha => {
                  const vals   = dreMensalBase.map(m => m[linha.key] as number);
                  const total  = vals.reduce((a, v) => a + v, 0);
                  if (total === 0) return null;
                  const subcatsReais = linha.catNome ? getSubcatsReais(linha.key, linha.catNome) : [];
                  const temReais = subcatsReais.length > 0;
                  // fallback estimado só se não houver dados reais
                  const catBoleto = (!temReais && linha.catNome) ? categoriasBoleto.find(c => c.nome === linha.catNome) : undefined;
                  const subcatsEst = catBoleto ? distribuirSubs(total, catBoleto.subcategorias) : [];
                  const hasExpand = temReais ? true : subcatsEst.length > 0;
                  const expanded  = dreExpanded.has(linha.key);

                  // Meta % — compara com % do faturamento acumulado
                  const unidKey16 = filtroUnidade === '1' ? '1' : filtroUnidade === '2' ? '2' : 'todas';
                  const totalFatAcum = dreMensalBase.reduce((a, m) => a + m.faturamentoTotal, 0);
                  const metaPct = getMetaDesp(linha.key, 2026, unidKey16);
                  const atualPct = totalFatAcum > 0 ? (total / totalFatAcum) * 100 : 0;
                  const metaCell = metaPct !== null ? (() => {
                    const excedeu   = atualPct > metaPct;
                    const proximo   = !excedeu && atualPct >= metaPct * 0.85;
                    const [bg, fg]  = excedeu   ? ['bg-red-50',     'text-red-700']
                                    : proximo   ? ['bg-amber-50',   'text-amber-700']
                                    :             ['bg-emerald-50', 'text-emerald-700'];
                    const sinal = excedeu ? '↑' : '✓';
                    return (
                      <td className={`px-3 py-2.5 text-center text-xs font-semibold tabular-nums ${bg} ${fg} whitespace-nowrap`}>
                        <div className="flex flex-col items-center leading-tight">
                          <span>{atualPct.toFixed(1)}%</span>
                          <span className="text-[9px] opacity-70 font-normal">{sinal} meta {metaPct}%</span>
                        </div>
                      </td>
                    );
                  })() : <td className="px-3 py-2.5 text-center text-gray-300 text-xs">—</td>;

                  return [
                    <tr
                      key={linha.key}
                      className={`border-b border-gray-50 hover:bg-gray-50 ${hasExpand ? 'cursor-pointer' : ''} ${expanded ? 'bg-gray-50' : ''}`}
                      onClick={() => hasExpand && toggleDre(linha.key)}
                    >
                      <td className="px-5 py-2.5 text-gray-700">
                        <span className="flex items-center gap-2">
                          {hasExpand ? (
                            expanded
                              ? <ChevronDown size={14} className="text-amber-600 flex-shrink-0" />
                              : <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                          ) : <span className="w-3.5 inline-block" />}
                          {linha.label}
                          {linha.key === 'compraInsumos' && (
                            <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full ring-1 ring-purple-300/60 font-normal whitespace-nowrap">
                              <Link2 size={9} /> via boletos
                            </span>
                          )}
                        </span>
                      </td>
                      {vals.map((v, i) => {
                        const m = dreMensalBase[i];
                        const unidKey = filtroUnidade === '1' ? '1' : filtroUnidade === '2' ? '2' : 'todas';
                        const metaPct = getMetaDesp(linha.key, anoRange, unidKey);
                        const atualPctM = m.faturamentoTotal > 0 ? (v / m.faturamentoTotal) * 100 : null;
                        const cor = (metaPct === null || atualPctM === null) ? null
                          : atualPctM <= metaPct ? 'text-emerald-600'
                          : atualPctM <= metaPct * 1.15 ? 'text-amber-600'
                          : 'text-red-600';
                        return (
                          <td key={i} className="px-3 py-2.5 text-right text-gray-600 tabular-nums text-xs whitespace-nowrap">
                            {formatCurrency(v)}
                            {cor && atualPctM !== null && (
                              <span className={`block text-[9px] font-semibold leading-none mt-0.5 ${cor}`}>
                                {atualPctM <= (metaPct ?? 0) ? '✓' : '↑'} {atualPctM.toFixed(1)}%
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-5 py-2.5 text-right font-semibold text-gray-800 tabular-nums bg-amber-50/30 whitespace-nowrap">
                        {formatCurrency(total)}
                      </td>
                      {metaCell}
                    </tr>,
                    ...(expanded && temReais ? subcatsReais.map(s => (
                      <tr key={`${linha.key}-${s.nome}`} className="border-b border-gray-50 bg-gray-50/60">
                        <td className="pl-10 pr-5 py-2 text-xs text-gray-600 font-medium">{s.nome}</td>
                        {s.porMes.map((v, i) => (
                          <td key={i} className="px-3 py-2 text-right text-xs tabular-nums whitespace-nowrap text-gray-600">
                            {v > 0 ? formatCurrency(v) : <span className="text-gray-200">—</span>}
                          </td>
                        ))}
                        <td className="px-5 py-2 text-right text-xs text-gray-700 tabular-nums font-semibold bg-amber-50/30 whitespace-nowrap">
                          {formatCurrency(s.total)}
                        </td>
                        <td className="px-3 py-2 text-center text-gray-300 text-xs">—</td>
                      </tr>
                    )) : expanded && subcatsEst.length > 0 ? subcatsEst.map(s => (
                      <tr key={`${linha.key}-${s.nome}`} className="border-b border-gray-50 bg-gray-50/60">
                        <td className="pl-10 pr-5 py-2 text-xs text-gray-500">{s.nome}</td>
                        <td colSpan={dreMensalBase.length} className="px-3 py-2 text-xs text-gray-400 text-center italic">estimativa</td>
                        <td className="px-5 py-2 text-right text-xs text-gray-600 tabular-nums font-medium bg-amber-50/30">
                          {formatCurrency(s.valor)}
                        </td>
                        <td className="px-3 py-2 text-center text-gray-300 text-xs">—</td>
                      </tr>
                    )) : []),
                  ];
                })}
                {/* Total despesas */}
                <tr className="border-t-2 border-gray-200 bg-red-50">
                  <td className="px-5 py-3 font-semibold text-gray-900 pl-8">Total de Despesas</td>
                  {dreMensalBase.map(m => (
                    <td key={m.mes} className="px-3 py-3 text-right font-medium text-red-700 tabular-nums text-xs whitespace-nowrap">
                      {formatCurrency(m.despesasTotal)}
                    </td>
                  ))}
                  <td className="px-5 py-3 text-right font-bold text-red-700 tabular-nums bg-red-50/60 whitespace-nowrap">
                    {formatCurrency(dreMensalBase.reduce((a, m) => a + m.despesasTotal, 0))}
                  </td>
                  <td className="px-3 py-3 text-center text-gray-300 text-xs">—</td>
                </tr>
                {/* Resultado */}
                <tr className="border-t-2 border-gray-200">
                  <td className="px-5 py-3 font-bold text-gray-900 bg-emerald-50">Resultado</td>
                  {dreMensalBase.map(m => {
                    const unidKey = filtroUnidade === '1' ? '1' : filtroUnidade === '2' ? '2' : 'todas';
                    const metaLucroM = getMetaLucro('mensal', anoRange, unidKey);
                    const pctLucro = metaLucroM > 0 ? (m.lucro / metaLucroM) * 100 : null;
                    const cor = pctLucro === null ? null : pctLucro >= 100 ? 'text-emerald-700' : pctLucro >= 85 ? 'text-amber-600' : 'text-red-600';
                    return (
                      <td key={m.mes} className={`px-3 py-3 text-right font-bold tabular-nums text-xs whitespace-nowrap ${m.lucro >= 0 ? 'text-emerald-700 bg-emerald-50/60' : 'text-red-700 bg-red-50/60'}`}>
                        {formatCurrency(m.lucro)}
                        {cor && pctLucro !== null && (
                          <span className={`block text-[9px] font-semibold leading-none mt-0.5 ${cor}`}>
                            {pctLucro >= 100 ? '✓' : '↓'} {pctLucro.toFixed(0)}% meta
                          </span>
                        )}
                      </td>
                    );
                  })}
                  {(() => {
                    const totalLucro = dreMensalBase.reduce((a, m) => a + m.lucro, 0);
                    return (
                      <td className={`px-5 py-3 text-right font-bold tabular-nums whitespace-nowrap ${totalLucro >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
                        {formatCurrency(totalLucro)}
                      </td>
                    );
                  })()}
                  <td className="px-3 py-3 text-center text-gray-300 text-xs">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── 2g + 2h: Pizza e Curva ABC A+B ────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* 2g — pizza */}
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Despesas por Categoria — Junho</h2>
            <div className="flex items-center gap-4">
              <PieChart width={160} height={160}>
                <Pie data={pieData} cx={75} cy={75} innerRadius={40} outerRadius={70} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => typeof v === 'number' ? formatCurrency(v) : v} />
              </PieChart>
              <div className="flex-1 space-y-1.5">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-xs text-gray-600">{d.name}</span>
                    </div>
                    <span className="text-xs font-medium text-gray-800 tabular-nums">
                      {formatPercent(pct(d.value, dreBase.despesasTotal))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 2h — curva ABC apenas A e B */}
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Curva ABC — Insumos Prioritários</h2>
              <p className="text-xs text-gray-400 mt-0.5">Exibindo apenas classes A e B (70–90% do gasto)</p>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Insumo', 'Total', '% Acum.', 'Classe'].map(h => (
                    <th key={h} className="px-4 py-2 text-left font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {abAB.map(item => (
                  <tr key={item.produto} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-900">
                      <p>{item.produto}</p>
                      <p className="text-gray-400 font-normal">{item.fornecedor}</p>
                    </td>
                    <td className="px-4 py-2 font-semibold text-gray-800 tabular-nums">{formatCurrency(item.totalGasto)}</td>
                    <td className="px-4 py-2 text-gray-600 tabular-nums">{formatPercent(item.percentualAcumulado)}</td>
                    <td className="px-4 py-2">
                      <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                        item.classe === 'A'
                          ? 'bg-red-100 text-red-700 ring-1 ring-red-600/20'
                          : 'bg-amber-100 text-amber-700 ring-1 ring-amber-600/20'
                      }`}>
                        {item.classe}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        {/* ── Gauges de Metas — Grupo 1 (Anuais) + Grupo 2 (Período) ── */}
        {(() => {
          const MC = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
          const unidKey = filtroUnidade === '1' ? '1' : filtroUnidade === '2' ? '2' : 'todas';
          const nMeses  = mesFim - mesInicio + 1;
          const isAnual = nMeses >= 12;
          const periodoLabel = mesInicio === mesFim
            ? `${MC[mesInicio]} ${anoRange}`
            : `${MC[mesInicio]}–${MC[mesFim]} ${anoRange}`;
          const tipoLabel = nMeses === 1 ? 'mensal' : isAnual ? 'anual' : `${nMeses} meses`;

          // ── GRUPO 1: Metas Anuais (ignora filtro de data) ──────────
          const realizadoFatAnual   = dreMensalBase.reduce((a, m) => a + m.faturamentoTotal, 0);
          const realizadoLucroAnual = dreMensalBase.reduce((a, m) => a + m.lucro, 0);
          const metaFatAnual   = getMetaFat('anual', anoRange, unidKey);
          const metaLucroAnual = getMetaLucro('anual', anoRange, unidKey);

          // Despesas: acumulado do ano / faturamento acumulado
          const despCatsAnual = DEFAULT_DESP.map((d) => {
            const metaPct  = getMetaDesp(d.categoriaKey, anoRange, unidKey);
            const despTotal = dreMensalBase.reduce(
              (a, m) => a + ((m[d.categoriaKey as keyof typeof m] as number) ?? 0), 0
            );
            const atualPct = realizadoFatAnual > 0 ? (despTotal / realizadoFatAnual) * 100 : 0;
            return { ...d, metaPct, atualPct };
          }).filter((d) => d.metaPct !== null && d.metaPct! > 0);

          // ── GRUPO 2: Metas do Período (segue filtro de data) ───────
          const mesesRange    = dreMensalBase.filter((_, i) => i >= mesInicio && i <= Math.min(mesFim, dreMensalBase.length - 1));
          const realizadoFat  = mesesRange.reduce((a, m) => a + m.faturamentoTotal, 0);
          const realizadoLucro = mesesRange.reduce((a, m) => a + m.lucro, 0);
          const metaFatPeriodo   = isAnual ? getMetaFat('anual', anoRange, unidKey)   : getMetaFat('mensal', anoRange, unidKey)   * nMeses;
          const metaLucroPeriodo = isAnual ? getMetaLucro('anual', anoRange, unidKey) : getMetaLucro('mensal', anoRange, unidKey) * nMeses;

          const g1Fat   = metaFatAnual > 0;
          const g1Lucro = metaLucroAnual > 0;
          const g1Desp  = despCatsAnual.length > 0;
          const g2Fat   = metaFatPeriodo > 0;
          const g2Lucro = metaLucroPeriodo > 0;

          if (!g1Fat && !g1Lucro && !g1Desp && !g2Fat && !g2Lucro) return null;

          return (
            <section className="bg-white rounded-xl border border-gray-200 p-5">
              {/* Título da seção */}
              <div className="flex items-center gap-2 mb-7">
                <Target size={15} className="text-amber-600" />
                <h2 className="text-sm font-semibold text-gray-900">Acompanhamento de Metas</h2>
              </div>

              {/* ════════ GRUPO 1 — METAS ANUAIS ════════ */}
              {(g1Fat || g1Lucro || g1Desp) && (
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                      Metas Anuais — {anoRange}
                    </span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <p className="text-xs text-gray-400 text-center mb-6">
                    Não se altera ao mudar o período do filtro · acumulado Jan–{MC[dreMensalBase.length - 1]} vs meta anual
                  </p>

                  {/* Fat + Lucro anuais */}
                  {(g1Fat || g1Lucro) && (
                    <div className="flex flex-wrap gap-6 justify-around mb-6">
                      {g1Fat && (
                        <MetaGauge
                          titulo={`Faturamento Acumulado ${anoRange}`}
                          valor={realizadoFatAnual}
                          meta={metaFatAnual}
                          tipo="faturamento"
                        />
                      )}
                      {g1Lucro && (
                        <MetaGauge
                          titulo={`Lucro Acumulado ${anoRange}`}
                          valor={realizadoLucroAnual}
                          meta={metaLucroAnual}
                          tipo="lucro"
                        />
                      )}
                    </div>
                  )}

                  {/* Despesas anuais */}
                  {g1Desp && (
                    <div className={(g1Fat || g1Lucro) ? 'border-t border-gray-100 pt-6' : ''}>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-5 text-center">
                        Despesas por Categoria — % máx. do faturamento acumulado
                      </p>
                      <div className="flex flex-wrap gap-6 justify-around">
                        {despCatsAnual.map((d) => (
                          <MetaGauge
                            key={d.categoriaKey}
                            titulo={d.categoriaNome}
                            valor={d.atualPct}
                            meta={d.metaPct!}
                            tipo="despesa"
                            unidade="percent"
                          />
                        ))}
                      </div>
                      <div className="mt-5 flex items-center gap-4 text-xs text-gray-400 flex-wrap justify-center">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Dentro da meta</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Próximo do limite (≥85%)</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Acima da meta</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ════════ GRUPO 2 — METAS DO PERÍODO ════════ */}
              {(g2Fat || g2Lucro) && (
                <div className={(g1Fat || g1Lucro || g1Desp) ? 'border-t-2 border-dashed border-gray-200 pt-8' : ''}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-amber-100" />
                    <span className="text-[11px] font-bold text-amber-700 uppercase tracking-widest px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-200">
                      Metas do Período — {periodoLabel}
                    </span>
                    <div className="flex-1 h-px bg-amber-100" />
                  </div>
                  <p className="text-xs text-gray-400 text-center mb-6">
                    {tipoLabel === 'mensal'
                      ? 'Meta mensal · muda conforme o período selecionado no filtro'
                      : `Meta mensal × ${nMeses} · muda conforme o período selecionado no filtro`}
                  </p>

                  <div className="flex flex-wrap gap-6 justify-around">
                    {g2Fat && (
                      <MetaGauge
                        titulo={`Faturamento · ${periodoLabel}`}
                        valor={realizadoFat}
                        meta={metaFatPeriodo}
                        tipo="faturamento"
                      />
                    )}
                    {g2Lucro && (
                      <MetaGauge
                        titulo={`Lucro · ${periodoLabel}`}
                        valor={realizadoLucro}
                        meta={metaLucroPeriodo}
                        tipo="lucro"
                      />
                    )}
                  </div>

                  <div className="mt-5 flex items-center gap-4 text-xs text-gray-400 flex-wrap justify-center">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Atingindo (≥85%)</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Em andamento (50–85%)</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Abaixo do esperado</span>
                  </div>
                </div>
              )}
            </section>
          );
        })()}

        {/* ── 2i: Alerta de alta de preços ──────────────────── */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Alerta de Alta de Preços de Insumos</h2>
              <p className="text-xs text-gray-400 mt-0.5">{alertasPreco.length} insumos com aumento identificado no período · clique para ver histórico</p>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {alertasPreco.map(alerta => {
              const varPct = ((alerta.precoAtual - alerta.precoAnterior) / alerta.precoAnterior) * 100;
              const aberto = alertaAberto === alerta.produto;
              return (
                <div key={alerta.produto}>
                  <button
                    onClick={() => setAlertaAberto(aberto ? null : alerta.produto)}
                    className="w-full px-5 py-3.5 flex items-center gap-4 hover:bg-amber-50/40 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{alerta.produto}</p>
                        <span className="text-xs text-gray-400">· {alerta.fornecedor}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs">
                        <span className="text-gray-400">Anterior: <strong className="text-gray-600">R$ {alerta.precoAnterior.toFixed(2)}</strong></span>
                        <span className="text-gray-300">→</span>
                        <span className="text-gray-400">Atual: <strong className="text-gray-800">R$ {alerta.precoAtual.toFixed(2)}</strong></span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg flex-shrink-0">
                      +{varPct.toFixed(1)}%
                    </span>
                    {aberto
                      ? <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                      : <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />}
                  </button>
                  {aberto && (
                    <div className="px-5 pb-4 pt-1 bg-amber-50/30">
                      <p className="text-xs text-gray-500 mb-2">Evolução do preço unitário (R$/un) — Jan–Jun 2026</p>
                      <ResponsiveContainer width="100%" height={140}>
                        <LineChart data={alerta.historico} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                          <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `R$${v.toFixed(2)}`} width={56} domain={['auto', 'auto']} />
                          <Tooltip formatter={(v) => typeof v === 'number' ? `R$ ${v.toFixed(2)}` : v} />
                          <Line type="monotone" dataKey="preco" name="Preço" stroke="#EF4444" strokeWidth={2} dot={{ r: 4, fill: '#EF4444' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </main>
    </>
  );
}
