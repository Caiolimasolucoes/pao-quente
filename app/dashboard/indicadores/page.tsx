'use client';

import { useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import {
  dreMensal, dreMensalU1, dreMensalU2,
  dreAtual, dreAtualU1, dreAtualU2, dreMesAnterior,
  faturamentoDiario, curvaABC, categoriasBoleto,
} from '@/lib/mock-data';
import { formatCurrency, formatPercent, calcPercent, calcVariation } from '@/lib/utils';
import { useUnit } from '@/contexts/UnitContext';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, TrendingDown, ChevronRight, ChevronDown,
  AlertTriangle, DollarSign, ShoppingBag,
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
      <p className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(value)}</p>
      <div className={`flex items-center gap-1 text-xs ${varColor}`}>
        <VarIcon size={12} />
        <span className="font-medium">{up ? '+' : ''}{formatPercent(variation)}</span>
        <span className="text-gray-400 ml-1">vs mês anterior</span>
      </div>
    </div>
  );
}

export default function IndicadoresPage() {
  const { filtroUnidade } = useUnit();
  const [dreExpanded, setDreExpanded] = useState<Set<string>>(new Set());
  const [alertaAberto, setAlertaAberto]  = useState<string | null>(null);

  const dreBase: DREMes   = filtroUnidade === '1' ? dreAtualU1 : filtroUnidade === '2' ? dreAtualU2 : dreAtual;
  const drePrev: DREMes   = filtroUnidade === '1' ? dreMensalU1.at(-2)! : filtroUnidade === '2' ? dreMensalU2.at(-2)! : dreMesAnterior;
  const dreMensalBase     = filtroUnidade === '1' ? dreMensalU1 : filtroUnidade === '2' ? dreMensalU2 : dreMensal;

  // 2b — faturamento diário por unidade
  const dadosDiarios = useMemo(() => {
    const datas = [...new Set(faturamentoDiario.map(f => f.data))].sort();
    return datas.map(data => {
      const u1 = faturamentoDiario.find(f => f.data === data && f.unidadeId === '1');
      const u2 = faturamentoDiario.find(f => f.data === data && f.unidadeId === '2');
      const row: Record<string, unknown> = { dia: data.slice(8) };
      if (filtroUnidade !== '2') row.Centro = u1?.valor ?? 0;
      if (filtroUnidade !== '1') row.Bairro  = u2?.valor ?? 0;
      return row;
    });
  }, [filtroUnidade]);

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
  }, [filtroUnidade]);

  // 2d — comparativo anual (mock ano anterior = ~87% com crescimento linear)
  const comparativoU1 = dreMensalU1.map((d, i) => ({ mes: d.mes, '2026': d.faturamentoTotal, '2025': Math.round(d.faturamentoTotal * (0.84 + i * 0.01)) }));
  const comparativoU2 = dreMensalU2.map((d, i) => ({ mes: d.mes, '2026': d.faturamentoTotal, '2025': Math.round(d.faturamentoTotal * (0.83 + i * 0.012)) }));

  const crescU1 = calcPercent(dreMensalU1.at(-1)!.faturamentoTotal - comparativoU1.at(-1)!['2025'], comparativoU1.at(-1)!['2025']);
  const crescU2 = calcPercent(dreMensalU2.at(-1)!.faturamentoTotal - comparativoU2.at(-1)!['2025'], comparativoU2.at(-1)!['2025']);

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
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Faturamento Diário — Junho 2026</h2>
          <p className="text-xs text-gray-400 mb-4">Uma linha por unidade · dias sem movimento aparecem como zero</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dadosDiarios} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
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

        {/* ── 2f: DRE Expandível ─────────────────────────────── */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">DRE Expandível — Junho 2026</h2>
            <p className="text-xs text-gray-400 mt-0.5">Clique em + para ver subcategorias</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Linha</th>
                <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-36">Valor</th>
                <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">% Fat.</th>
              </tr>
            </thead>
            <tbody>
              {/* Faturamento */}
              <tr className="border-b border-gray-100 bg-amber-50">
                <td className="px-5 py-3 font-bold text-gray-900">Faturamento Total</td>
                <td className="px-5 py-3 text-right font-bold text-gray-900 tabular-nums">{formatCurrency(dreBase.faturamentoTotal)}</td>
                <td className="px-5 py-3 text-right font-bold text-amber-700">100%</td>
              </tr>
              {/* Despesas */}
              {dreLinhas.map(linha => {
                const val = dreBase[linha.key] as number;
                if (val === 0) return null;
                const catBoleto = linha.catNome ? categoriasBoleto.find(c => c.nome === linha.catNome) : undefined;
                const subcats   = catBoleto ? distribuirSubs(val, catBoleto.subcategorias) : [];
                const expanded  = dreExpanded.has(linha.key);
                const pctVal    = pct(val, dreBase.faturamentoTotal);

                return [
                  <tr
                    key={linha.key}
                    className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${expanded ? 'bg-gray-50' : ''}`}
                    onClick={() => subcats.length > 0 && toggleDre(linha.key)}
                  >
                    <td className="px-5 py-2.5 text-gray-700 flex items-center gap-2">
                      {subcats.length > 0 ? (
                        expanded
                          ? <ChevronDown size={14} className="text-amber-600 flex-shrink-0" />
                          : <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                      ) : <span className="w-3.5 inline-block" />}
                      {linha.label}
                    </td>
                    <td className="px-5 py-2.5 text-right text-gray-700 tabular-nums">{formatCurrency(val)}</td>
                    <td className="px-5 py-2.5 text-right text-gray-500 tabular-nums">{formatPercent(pctVal)}</td>
                  </tr>,
                  ...(expanded ? subcats.map(s => (
                    <tr key={`${linha.key}-${s.nome}`} className="border-b border-gray-50 bg-gray-50/60">
                      <td className="pl-10 pr-5 py-2 text-xs text-gray-500">{s.nome}</td>
                      <td className="px-5 py-2 text-right text-xs text-gray-500 tabular-nums">{formatCurrency(s.valor)}</td>
                      <td className="px-5 py-2 text-right text-xs text-gray-400 tabular-nums">{formatPercent(pct(s.valor, dreBase.faturamentoTotal))}</td>
                    </tr>
                  )) : []),
                ];
              })}
              {/* Total despesas */}
              <tr className="border-t-2 border-gray-200 bg-red-50">
                <td className="px-5 py-3 font-semibold text-gray-900 pl-8">Total de Despesas</td>
                <td className="px-5 py-3 text-right font-semibold text-red-700 tabular-nums">{formatCurrency(dreBase.despesasTotal)}</td>
                <td className="px-5 py-3 text-right font-semibold text-red-700 tabular-nums">{formatPercent(pct(dreBase.despesasTotal, dreBase.faturamentoTotal))}</td>
              </tr>
              {/* Lucro */}
              <tr className={`border-t-2 border-gray-200 ${dreBase.lucro >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <td className="px-5 py-3 font-bold text-gray-900">Resultado</td>
                <td className={`px-5 py-3 text-right font-bold tabular-nums ${dreBase.lucro >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(dreBase.lucro)}</td>
                <td className={`px-5 py-3 text-right font-bold tabular-nums ${dreBase.lucro >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatPercent(pct(dreBase.lucro, dreBase.faturamentoTotal))}</td>
              </tr>
            </tbody>
          </table>
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
