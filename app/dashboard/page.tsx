'use client';

import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/layout/Header';
import KpiCard from '@/components/ui/KpiCard';
import RevenueLineChart from '@/components/charts/RevenueLineChart';
import ExpensePieChart from '@/components/charts/ExpensePieChart';
import { insights } from '@/lib/mock-data';
import { formatCurrency, calcVariation, formatPercent, calcPercent } from '@/lib/utils';
import { useUnit } from '@/contexts/UnitContext';
import { useMetas } from '@/contexts/MetasContext';
import { useDateRange } from '@/contexts/DateRangeContext';
import { DollarSign, ShoppingBag, TrendingUp, AlertTriangle, CheckCircle, Info, Building2, Target } from 'lucide-react';
import { MetaGauge } from '@/components/ui/MetaGauge';
import { createClient } from '@/lib/supabase/client';
import type { DREMes } from '@/types';

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const CORES_UNIDADE = ['#D97706', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444'];

const CAT_KEY: Record<string, string> = {
  'compra de insumos': 'compra_insumos', 'folha de pagamento': 'folha_pagamento',
  'impostos': 'impostos', 'despesas adm': 'despesas_adm', 'manutenção': 'manutencao',
  'investimento': 'investimento', 'pró labore': 'pro_labore', 'pro labore': 'pro_labore',
  'retira sócio': 'retira_socio', 'retira socio': 'retira_socio',
  'insumos': 'compra_insumos', 'encargos': 'impostos',
};
const SUBCAT_KEY: Record<string, string> = {
  'folha de pagamento': 'folha_pagamento', 'pró labore': 'pro_labore', 'pro labore': 'pro_labore',
  'retira sócio': 'retira_socio', 'retira socio': 'retira_socio',
  'simples nacional': 'impostos', 'fgts': 'impostos', 'inss': 'impostos',
  'manutenção': 'manutencao', 'investimento': 'investimento', 'despesas adm': 'despesas_adm',
};

const EMPTY_DRE: DREMes = {
  mes: '—', faturamentoTotal: 0, faturamentoReal: 0, compraInsumos: 0,
  folhaPagamento: 0, impostos: 0, despesasAdm: 0, manutencao: 0,
  investimento: 0, proLabore: 0, retiraSocio: 0, despesasTotal: 0, lucro: 0,
};

const insightIconMap = {
  alerta:   { Icon: AlertTriangle, bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-100' },
  atencao:  { Icon: Info,          bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-100' },
  positivo: { Icon: CheckCircle,   bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
};

type RawSoma = {
  faturamento_total: number; faturamento_real: number; compra_insumos: number;
  folha_pagamento: number; impostos: number; despesas_adm: number; manutencao: number;
  investimento: number; pro_labore: number; retira_socio: number;
  despesas_total: number; lucro: number;
};

function somarCampos(rows: any[]): RawSoma {
  return rows.reduce((a, r) => ({
    faturamento_total: a.faturamento_total + (Number(r.faturamento_total) || 0),
    faturamento_real:  a.faturamento_real  + (Number(r.faturamento_real)  || 0),
    compra_insumos:    a.compra_insumos    + (Number(r.compra_insumos)    || 0),
    folha_pagamento:   a.folha_pagamento   + (Number(r.folha_pagamento)   || 0),
    impostos:          a.impostos          + (Number(r.impostos)          || 0),
    despesas_adm:      a.despesas_adm      + (Number(r.despesas_adm)      || 0),
    manutencao:        a.manutencao        + (Number(r.manutencao)        || 0),
    investimento:      a.investimento      + (Number(r.investimento)      || 0),
    pro_labore:        a.pro_labore        + (Number(r.pro_labore)        || 0),
    retira_socio:      a.retira_socio      + (Number(r.retira_socio)      || 0),
    despesas_total:    a.despesas_total    + (Number(r.despesas_total)    || 0),
    lucro:             a.lucro             + (Number(r.lucro)             || 0),
  }), {
    faturamento_total: 0, faturamento_real: 0, compra_insumos: 0, folha_pagamento: 0,
    impostos: 0, despesas_adm: 0, manutencao: 0, investimento: 0,
    pro_labore: 0, retira_socio: 0, despesas_total: 0, lucro: 0,
  });
}

function rawToDRE(raw: RawSoma, mesLabel: string): DREMes {
  return {
    mes:             mesLabel,
    faturamentoTotal: raw.faturamento_total,
    faturamentoReal:  raw.faturamento_real,
    compraInsumos:    raw.compra_insumos,
    folhaPagamento:   raw.folha_pagamento,
    impostos:         raw.impostos,
    despesasAdm:      raw.despesas_adm,
    manutencao:       raw.manutencao,
    investimento:     raw.investimento,
    proLabore:        raw.pro_labore,
    retiraSocio:      raw.retira_socio,
    despesasTotal:    raw.despesas_total,
    lucro:            raw.lucro,
  };
}

export default function DashboardPage() {
  const { filtroUnidade, unidades } = useUnit();
  const { getMetaFat, getMetaLucro } = useMetas();
  const { mesInicio, mesFim, ano } = useDateRange();

  const [fatDiarioDB, setFatDiarioDB] = useState<any[]>([]);
  const [boletosDB, setBoletosDB]     = useState<any[]>([]);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('faturamento_diario').select('*').order('data'),
      supabase.from('boletos').select('categoria,sub_categoria,valor,unidade_id,vencimento,status'),
    ]).then(([{ data: fat }, { data: bol }]) => {
      setFatDiarioDB(fat || []);
      setBoletosDB(bol || []);
    });
  }, []);

  // DRE mensal computado dinamicamente (mesma lógica de indicadores/page.tsx)
  const dreDB = useMemo(() => {
    type DBRow = {
      unidade_id: string; ano: number; mes: number;
      faturamento_total: number; faturamento_real: number; compra_insumos: number;
      folha_pagamento: number; impostos: number; despesas_adm: number; manutencao: number;
      investimento: number; pro_labore: number; retira_socio: number;
      despesas_total: number; lucro: number;
    };
    const blank = (uid: string, a: number, m: number): DBRow => ({
      unidade_id: uid, ano: a, mes: m,
      faturamento_total: 0, faturamento_real: 0, compra_insumos: 0, folha_pagamento: 0,
      impostos: 0, despesas_adm: 0, manutencao: 0, investimento: 0,
      pro_labore: 0, retira_socio: 0, despesas_total: 0, lucro: 0,
    });
    const map: Record<string, DBRow> = {};
    const getRow = (uid: string, a: number, m: number) => {
      const k = `${uid}-${a}-${m}`;
      if (!map[k]) map[k] = blank(uid, a, m);
      return map[k];
    };
    for (const d of fatDiarioDB) {
      const dt = new Date(d.data + 'T12:00:00');
      const r = getRow(d.unidade_id, dt.getFullYear(), dt.getMonth());
      const v = Number(d.valor) || 0;
      r.faturamento_total += v; r.faturamento_real += v;
    }
    for (const b of boletosDB) {
      if (!b.vencimento) continue;
      const dt = new Date((b.vencimento as string) + 'T12:00:00');
      const r = getRow(b.unidade_id, dt.getFullYear(), dt.getMonth());
      const v = Number(b.valor) || 0;
      const sk = (b.sub_categoria as string)?.toLowerCase().trim();
      const ck = (b.categoria as string)?.toLowerCase().trim();
      const field = (sk && SUBCAT_KEY[sk]) || CAT_KEY[ck];
      if (field) (r as any)[field] += v;
    }
    for (const r of Object.values(map)) {
      r.despesas_total = r.compra_insumos + r.folha_pagamento + r.impostos +
        r.despesas_adm + r.manutencao + r.investimento + r.pro_labore + r.retira_socio;
      r.lucro = r.faturamento_total - r.despesas_total;
    }
    return Object.values(map).sort((a, b) => a.ano !== b.ano ? a.ano - b.ano : a.mes - b.mes);
  }, [fatDiarioDB, boletosDB]);

  const periodoLabel = mesInicio === mesFim
    ? `${MESES[mesInicio]} ${ano}`
    : `${MESES[mesInicio]}–${MESES[mesFim]} ${ano}`;

  // KPIs para o período filtrado (responde a data e unidade)
  const kpi = useMemo(() => {
    const base = filtroUnidade === 'todas' ? dreDB : dreDB.filter(r => r.unidade_id === filtroUnidade);
    const curr = base.filter(r => r.ano === ano && r.mes >= mesInicio && r.mes <= mesFim);
    const prev = mesInicio === mesFim
      ? base.filter(r => {
          const pm = mesInicio === 0 ? 11 : mesInicio - 1;
          const pa = mesInicio === 0 ? ano - 1 : ano;
          return r.ano === pa && r.mes === pm;
        })
      : base.filter(r => r.ano === ano - 1 && r.mes >= mesInicio && r.mes <= mesFim);
    return { curr: somarCampos(curr), prev: somarCampos(prev) };
  }, [dreDB, filtroUnidade, ano, mesInicio, mesFim]);

  const dreBase    = rawToDRE(kpi.curr, periodoLabel);
  const dreBaseAnt = rawToDRE(kpi.prev, periodoLabel);

  const varFaturamento = calcVariation(dreBase.faturamentoTotal, dreBaseAnt.faturamentoTotal);
  const varDespesas    = calcVariation(dreBase.despesasTotal,    dreBaseAnt.despesasTotal);
  const varCompras     = calcVariation(dreBase.compraInsumos,    dreBaseAnt.compraInsumos);
  const varLucro       = calcVariation(dreBase.lucro,            dreBaseAnt.lucro);

  // Comparativo por unidade — dinâmico, um card por unidade cadastrada
  const unidadesComparativo = useMemo(() => {
    const totalFat = dreDB
      .filter(r => r.ano === ano && r.mes >= mesInicio && r.mes <= mesFim)
      .reduce((a, r) => a + (Number(r.faturamento_total) || 0), 0);
    return unidades.map((u, i) => {
      const uRows = dreDB.filter(r =>
        r.unidade_id === u.id && r.ano === ano && r.mes >= mesInicio && r.mes <= mesFim
      );
      const raw = somarCampos(uRows);
      return { unidade: u, dre: rawToDRE(raw, periodoLabel), cor: CORES_UNIDADE[i % CORES_UNIDADE.length], totalFat };
    });
  }, [unidades, dreDB, ano, mesInicio, mesFim, periodoLabel]);

  // Evolução mensal para o gráfico de linha
  const dreEvolucao = useMemo((): DREMes[] => {
    const base = filtroUnidade === 'todas' ? dreDB : dreDB.filter(r => r.unidade_id === filtroUnidade);
    const anos = [...new Set(base.map(r => r.ano))];
    const multi = anos.length > 1;
    const map: Record<string, { key: string; mes: string; fat: number; desp: number; lucro: number }> = {};
    for (const r of base) {
      const k = `${r.ano}-${String(r.mes).padStart(2, '0')}`;
      const label = multi ? `${MESES[r.mes]}/${String(r.ano).slice(2)}` : MESES[r.mes];
      if (!map[k]) map[k] = { key: k, mes: label, fat: 0, desp: 0, lucro: 0 };
      map[k].fat   += Number(r.faturamento_total) || 0;
      map[k].desp  += Number(r.despesas_total)    || 0;
      map[k].lucro += Number(r.lucro)             || 0;
    }
    return Object.values(map)
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(({ mes, fat, desp, lucro }) => ({
        ...EMPTY_DRE, mes, faturamentoTotal: fat, despesasTotal: desp, lucro,
      }));
  }, [dreDB, filtroUnidade]);

  // Meios de pagamento reais do faturamento_diario
  const meiosPgto = useMemo(() => {
    const FORMAS = [
      { id: 'pix',        nome: 'Pix',        cor: '#10B981' },
      { id: 'debito',     nome: 'Débito',     cor: '#3B82F6' },
      { id: 'visa',       nome: 'Visa',       cor: '#8B5CF6' },
      { id: 'mastercard', nome: 'Mastercard', cor: '#D97706' },
      { id: 'elo',        nome: 'Elo',        cor: '#F59E0B' },
      { id: 'dinheiro',   nome: 'Dinheiro',   cor: '#6B7280' },
    ];
    const totais: Record<string, number> = {};
    for (const d of fatDiarioDB) {
      const [y, m] = (d.data as string).split('-').map(Number);
      const matchU = filtroUnidade === 'todas' || d.unidade_id === filtroUnidade;
      if (!matchU || y !== ano || (m - 1) < mesInicio || (m - 1) > mesFim) continue;
      if (!d.meios) continue;
      for (const [k, v] of Object.entries(d.meios as Record<string, number>)) {
        totais[k] = (totais[k] || 0) + (Number(v) || 0);
      }
    }
    return FORMAS.map(f => ({ ...f, valor: totais[f.id] || 0 })).filter(f => f.valor > 0);
  }, [fatDiarioDB, filtroUnidade, ano, mesInicio, mesFim]);

  const destaques = insights.slice(0, 3);

  return (
    <>
      <Header title="Resumo" />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* KPI Cards */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Consolidado — {periodoLabel}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard title="Faturamento"       value={dreBase.faturamentoTotal} variation={varFaturamento} iconBg="bg-amber-50"   icon={<DollarSign  size={20} className="text-amber-600" />} />
            <KpiCard title="Despesas Totais"   value={dreBase.despesasTotal}    variation={varDespesas}    iconBg="bg-red-50"     icon={<TrendingUp  size={20} className="text-red-500" />} />
            <KpiCard title="Compra de Insumos" value={dreBase.compraInsumos}    variation={varCompras}     iconBg="bg-blue-50"    icon={<ShoppingBag size={20} className="text-blue-500" />} />
            <KpiCard title="Lucro do Período"  value={dreBase.lucro}            variation={varLucro}       iconBg="bg-emerald-50" icon={<DollarSign  size={20} className="text-emerald-600" />} />
          </div>
        </div>

        {/* Comparativo por unidade — um card por unidade cadastrada */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Comparativo entre Unidades — {periodoLabel}</p>
          <div className={`grid grid-cols-1 ${unidadesComparativo.length > 1 ? 'sm:grid-cols-2' : ''} gap-4`}>
            {unidadesComparativo.map(({ unidade, dre, cor, totalFat }) => {
              const margem = calcPercent(dre.lucro, dre.faturamentoReal);
              const cmv    = calcPercent(dre.compraInsumos, dre.faturamentoReal);
              return (
                <div key={unidade.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cor }} />
                    <Building2 size={14} className="text-gray-400" />
                    <span className="text-sm font-semibold text-gray-900">{unidade.nome}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Faturamento', value: formatCurrency(dre.faturamentoTotal) },
                      { label: 'Lucro',        value: formatCurrency(dre.lucro),   color: dre.lucro >= 0 ? 'text-emerald-600' : 'text-red-600' },
                      { label: 'Margem Liq.',  value: formatPercent(margem),        color: margem >= 10 ? 'text-emerald-600' : 'text-amber-600' },
                      { label: 'CMV %',        value: formatPercent(cmv),           color: cmv <= 40 ? 'text-emerald-600' : 'text-red-600' },
                    ].map((item) => (
                      <div key={item.label}>
                        <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                        <p className={`text-base font-bold ${item.color ?? 'text-gray-900'}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-400">Participação no faturamento total</span>
                      <span className="font-medium text-gray-700">
                        {formatPercent(calcPercent(dre.faturamentoTotal, totalFat))}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${calcPercent(dre.faturamentoTotal, totalFat)}%`, backgroundColor: cor }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Evolução Financeira — {periodoLabel}</h2>
            <RevenueLineChart data={dreEvolucao} />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Despesas por Categoria — {periodoLabel}</h2>
            <ExpensePieChart data={dreBase} />
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Meios de Pagamento — {periodoLabel}</h2>
            <div className="space-y-3">
              {meiosPgto.length === 0 ? (
                <p className="text-sm text-gray-400">Sem dados no período.</p>
              ) : meiosPgto.map((mp) => {
                const pct = dreBase.faturamentoTotal > 0
                  ? ((mp.valor / dreBase.faturamentoTotal) * 100).toFixed(1)
                  : '0.0';
                return (
                  <div key={mp.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">{mp.nome}</span>
                      <span className="text-gray-500">{formatCurrency(mp.valor)} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: mp.cor }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Destaques do Período</h2>
              <a href="/dashboard/insights" className="text-xs text-amber-700 hover:text-amber-900 font-medium">Ver todos →</a>
            </div>
            <div className="space-y-3">
              {destaques.map((item) => {
                const { Icon, bg, text, border } = insightIconMap[item.tipo];
                return (
                  <div key={item.id} className={`flex gap-3 p-3 rounded-lg border ${bg} ${border}`}>
                    <Icon size={16} className={`${text} flex-shrink-0 mt-0.5`} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 mb-0.5">{item.titulo}</p>
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{item.descricao}</p>
                    </div>
                    {item.valor && (
                      <span className={`text-xs font-bold ${text} flex-shrink-0 self-start`}>{item.valor}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Acompanhamento de Metas */}
        {(() => {
          const unidKey = filtroUnidade === 'todas' ? 'todas' : filtroUnidade;
          const nMeses  = mesFim - mesInicio + 1;
          const isAnual = nMeses >= 12;
          const realizadoFat   = dreBase.faturamentoTotal;
          const realizadoLucro = dreBase.lucro;
          const metaFatBase   = isAnual ? getMetaFat('anual', ano, unidKey) : getMetaFat('mensal', ano, unidKey) * nMeses;
          const metaLucroBase = isAnual ? getMetaLucro('anual', ano, unidKey) : getMetaLucro('mensal', ano, unidKey) * nMeses;
          if (!metaFatBase && !metaLucroBase) return null;
          return (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Target size={15} className="text-amber-600" />
                  <h2 className="text-sm font-semibold text-gray-900">Acompanhamento de Metas</h2>
                </div>
                <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                  {periodoLabel} · {nMeses === 1 ? 'meta mensal' : isAnual ? 'meta anual' : `meta mensal × ${nMeses}`}
                </span>
              </div>
              <div className="flex flex-wrap gap-6 justify-around">
                {metaFatBase > 0 && (
                  <MetaGauge titulo={`Faturamento · ${periodoLabel}`} valor={realizadoFat} meta={metaFatBase} tipo="faturamento" />
                )}
                {metaLucroBase > 0 && (
                  <MetaGauge titulo={`Lucro · ${periodoLabel}`} valor={realizadoLucro} meta={metaLucroBase} tipo="lucro" />
                )}
              </div>
            </div>
          );
        })()}

      </main>
    </>
  );
}
