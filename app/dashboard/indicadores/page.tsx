'use client';

import { useState, useMemo, useEffect } from 'react';
import Header from '@/components/layout/Header';
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

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const CORES_UNIDADE = ['#D97706', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444'];
const PIE_COLORS = ['#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6', '#10B981', '#F97316', '#EC4899'];

const CAT_KEY: Record<string, string> = {
  'compra de insumos':  'compra_insumos',
  'folha de pagamento': 'folha_pagamento',
  'impostos':           'impostos',
  'despesas adm':       'despesas_adm',
  'manutenção':         'manutencao',
  'investimento':       'investimento',
  'pró labore':         'pro_labore',
  'pro labore':         'pro_labore',
  'retira sócio':       'retira_socio',
  'retira socio':       'retira_socio',
  'insumos':            'compra_insumos',
  'encargos':           'impostos',
};
const SUBCAT_KEY: Record<string, string> = {
  'folha de pagamento': 'folha_pagamento',
  'pró labore':         'pro_labore',
  'pro labore':         'pro_labore',
  'retira sócio':       'retira_socio',
  'retira socio':       'retira_socio',
  'simples nacional':   'impostos',
  'fgts':               'impostos',
  'inss':               'impostos',
  'manutenção':         'manutencao',
  'investimento':       'investimento',
  'despesas adm':       'despesas_adm',
};

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

function pct(v: number, ref: number) { return ref > 0 ? (v / ref) * 100 : 0; }

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
        <span className="text-gray-400 ml-1">vs período anterior</span>
      </div>
    </div>
  );
}

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

function sumDBRows(rows: any[]) {
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

function buildCurvaABC(itens: { nome: string; total: number }[]) {
  const sorted = [...itens].sort((a, b) => b.total - a.total);
  const totalGeral = sorted.reduce((a, b) => a + b.total, 0);
  let acum = 0;
  return sorted.map(item => {
    acum += item.total;
    const pctAcum = totalGeral > 0 ? (acum / totalGeral) * 100 : 0;
    const classe = pctAcum <= 70 ? 'A' : pctAcum <= 90 ? 'B' : 'C';
    return { ...item, pctAcum, classe };
  });
}

export default function IndicadoresPage() {
  const { filtroUnidade, unidades } = useUnit();
  const { getMetaDesp, getMetaLucro, getMetaFat } = useMetas();
  const { mesInicio, mesFim, ano: anoRange } = useDateRange();
  const [dreExpanded, setDreExpanded] = useState<Set<string>>(new Set());
  const [alertaAberto, setAlertaAberto]  = useState<string | null>(null);

  const [fatDiarioDB, setFatDiarioDB] = useState<any[]>([]);
  const [boletosDB, setBoletosDB]     = useState<any[]>([]);
  const [comprasDB, setComprasDB]     = useState<any[]>([]);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('faturamento_diario').select('*').order('data'),
      supabase.from('boletos').select('fornecedor,categoria,sub_categoria,valor,unidade_id,vencimento,status'),
      supabase.from('compras').select('produto,fornecedor,categoria,valor_total,valor_unitario,unidade_id,data'),
    ]).then(([{ data: fat }, { data: bol }, { data: cpr }]) => {
      setFatDiarioDB(fat || []);
      setBoletosDB(bol || []);
      setComprasDB(cpr || []);
    });
  }, []);

  // DRE mensal computado dinamicamente
  const dreDB = useMemo(() => {
    type DBRow = {
      unidade_id: string; ano: number; mes: number;
      faturamento_total: number; faturamento_real: number; compra_insumos: number;
      folha_pagamento: number; impostos: number; despesas_adm: number; manutencao: number;
      investimento: number; pro_labore: number; retira_socio: number;
      despesas_total: number; lucro: number;
    };
    const blank = (uid: string, ano: number, mes: number): DBRow => ({
      unidade_id: uid, ano, mes,
      faturamento_total: 0, faturamento_real: 0, compra_insumos: 0, folha_pagamento: 0,
      impostos: 0, despesas_adm: 0, manutencao: 0, investimento: 0,
      pro_labore: 0, retira_socio: 0, despesas_total: 0, lucro: 0,
    });
    const map: Record<string, DBRow> = {};
    const getRow = (uid: string, ano: number, mes: number) => {
      const k = `${uid}-${ano}-${mes}`;
      if (!map[k]) map[k] = blank(uid, ano, mes);
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

  // DRE por unidade (filtrado pelo ano selecionado)
  const drePorUnidade = useMemo(() => {
    const map: Record<string, DREMes[]> = {};
    for (const u of unidades) {
      map[u.id] = dreDB
        .filter(r => r.unidade_id === u.id && r.ano === anoRange)
        .map(mapDre);
    }
    return map;
  }, [dreDB, unidades, anoRange]);

  // DRE consolidado (todas as unidades somadas, filtrado pelo ano)
  const dreMensal = useMemo((): DREMes[] => {
    const byKey: Record<string, any> = {};
    for (const r of dreDB.filter(r => r.ano === anoRange)) {
      const k = `${r.ano}-${r.mes}`;
      if (!byKey[k]) byKey[k] = { ano: r.ano, mes: r.mes,
        faturamento_total: 0, faturamento_real: 0, compra_insumos: 0, folha_pagamento: 0,
        impostos: 0, despesas_adm: 0, manutencao: 0, investimento: 0,
        pro_labore: 0, retira_socio: 0, despesas_total: 0, lucro: 0 };
      const row = byKey[k];
      row.faturamento_total += Number(r.faturamento_total) || 0;
      row.faturamento_real  += Number(r.faturamento_real)  || 0;
      row.compra_insumos    += Number(r.compra_insumos)    || 0;
      row.folha_pagamento   += Number(r.folha_pagamento)   || 0;
      row.impostos          += Number(r.impostos)          || 0;
      row.despesas_adm      += Number(r.despesas_adm)      || 0;
      row.manutencao        += Number(r.manutencao)        || 0;
      row.investimento      += Number(r.investimento)      || 0;
      row.pro_labore        += Number(r.pro_labore)        || 0;
      row.retira_socio      += Number(r.retira_socio)      || 0;
      row.despesas_total    += Number(r.despesas_total)    || 0;
      row.lucro             += Number(r.lucro)             || 0;
    }
    return Object.values(byKey).sort((a, b) => a.ano !== b.ano ? a.ano - b.ano : a.mes - b.mes).map(mapDre);
  }, [dreDB, anoRange]);

  // DRE base para tabela (anual — ignora filtro de mês, só filtra por unidade e ano)
  const dreMensalBase = filtroUnidade === 'todas' ? dreMensal : (drePorUnidade[filtroUnidade] ?? []);

  // KPIs: soma o período filtrado (responde a data + unidade)
  const dreBase = useMemo((): DREMes => {
    const baseRows = filtroUnidade === 'todas' ? dreDB : dreDB.filter(r => r.unidade_id === filtroUnidade);
    const filtered = baseRows.filter(r => r.ano === anoRange && r.mes >= mesInicio && r.mes <= mesFim);
    return mapDre({ ...sumDBRows(filtered), mes: mesInicio, ano: anoRange });
  }, [dreDB, filtroUnidade, anoRange, mesInicio, mesFim]);

  const drePrev = useMemo((): DREMes => {
    const baseRows = filtroUnidade === 'todas' ? dreDB : dreDB.filter(r => r.unidade_id === filtroUnidade);
    let filtered: any[];
    if (mesInicio === mesFim) {
      const pm = mesInicio === 0 ? 11 : mesInicio - 1;
      const pa = mesInicio === 0 ? anoRange - 1 : anoRange;
      filtered = baseRows.filter(r => r.ano === pa && r.mes === pm);
    } else {
      filtered = baseRows.filter(r => r.ano === anoRange - 1 && r.mes >= mesInicio && r.mes <= mesFim);
    }
    return mapDre({ ...sumDBRows(filtered), mes: mesInicio, ano: anoRange });
  }, [dreDB, filtroUnidade, anoRange, mesInicio, mesFim]);

  const periodoLabel = mesInicio === mesFim
    ? `${MESES[mesInicio]} ${anoRange}`
    : `${MESES[mesInicio]}–${MESES[mesFim]} ${anoRange}`;

  // Unidades relevantes para gráficos diários/semanais
  const unidadesDados = filtroUnidade === 'todas' ? unidades : unidades.filter(u => u.id === filtroUnidade);

  // 2b — faturamento diário (responde a data + unidade, usa nomes reais)
  const faturamentoDiario = fatDiarioDB.map((d: any) => ({
    data: d.data, unidadeId: d.unidade_id, valor: Number(d.valor) || 0,
  }));

  const dadosDiarios = useMemo(() => {
    const isMultiMes = mesFim > mesInicio;
    const datas = [...new Set(faturamentoDiario.map(f => f.data))]
      .filter(data => {
        const [y, m] = data.split('-').map(Number);
        return y === anoRange && (m - 1) >= mesInicio && (m - 1) <= mesFim;
      })
      .sort();
    return datas.map(data => {
      const [, m, d] = data.split('-').map(Number);
      const label = isMultiMes
        ? `${String(d).padStart(2, '0')}/${MESES[m - 1]}`
        : String(d).padStart(2, '0');
      const row: Record<string, unknown> = { dia: label };
      for (const u of unidadesDados) {
        const fat = faturamentoDiario.find(f => f.data === data && f.unidadeId === u.id);
        row[u.nome] = fat?.valor ?? 0;
      }
      return row;
    });
  }, [filtroUnidade, unidades, faturamentoDiario, mesInicio, mesFim, anoRange]);

  const periodoLabelDiario = periodoLabel;
  const tickIntervalDiario = dadosDiarios.length > 60
    ? Math.ceil(dadosDiarios.length / 15) - 1
    : dadosDiarios.length > 31 ? 6 : 1;

  // 2c — média semanal (responde a data + unidade, usa nomes reais)
  const mediaSemanal = useMemo(() => {
    const nomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const g: Record<string, Record<number, number[]>> = {};
    for (const u of unidadesDados) {
      g[u.id] = {};
      for (let i = 0; i < 7; i++) g[u.id][i] = [];
    }
    faturamentoDiario.forEach(f => {
      if (f.valor <= 0) return;
      const [y, m] = f.data.split('-').map(Number);
      if (y !== anoRange || (m - 1) < mesInicio || (m - 1) > mesFim) return;
      if (!g[f.unidadeId]) return;
      const dow = new Date(f.data + 'T12:00:00').getDay();
      g[f.unidadeId][dow].push(f.valor);
    });
    return nomes.map((dia, dow) => {
      const row: Record<string, unknown> = { dia };
      for (const u of unidadesDados) {
        const vals = g[u.id]?.[dow] ?? [];
        row[u.nome] = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
      }
      return row;
    });
  }, [filtroUnidade, unidades, faturamentoDiario, mesInicio, mesFim, anoRange]);

  // 2d — comparativo anual por unidade (dinâmico)
  const comparativoPorUnidade = useMemo(() => {
    return unidadesDados.map((u, i) => {
      const dreU = dreDB
        .filter(r => r.unidade_id === u.id && r.ano === anoRange)
        .sort((a, b) => a.mes - b.mes)
        .map(mapDre);
      const data = dreU.map((d, idx) => ({
        mes: d.mes,
        [anoRange]: d.faturamentoTotal,
        [anoRange - 1]: Math.round(d.faturamentoTotal * (0.84 + idx * 0.01)),
      }));
      const last = dreU.at(-1);
      const lastPrev = (data.at(-1)?.[anoRange - 1] as number) ?? 1;
      const cresc = last ? calcPercent(last.faturamentoTotal - lastPrev, lastPrev) : 0;
      return { unidade: u, cor: CORES_UNIDADE[i % CORES_UNIDADE.length], data, cresc };
    });
  }, [unidadesDados, dreDB, anoRange]);

  // 2e — evolução combinada (todos os anos)
  const evolucao = useMemo(() => {
    type Row = { ano: number; mes: number; fat: number; desp: number; lucro: number };
    let rows: Row[];
    if (filtroUnidade !== 'todas') {
      rows = dreDB.filter(r => r.unidade_id === filtroUnidade)
        .sort((a, b) => a.ano !== b.ano ? a.ano - b.ano : a.mes - b.mes)
        .map(r => ({ ano: r.ano, mes: r.mes, fat: Number(r.faturamento_total) || 0, desp: Number(r.despesas_total) || 0, lucro: Number(r.lucro) || 0 }));
    } else {
      const byKey: Record<string, Row> = {};
      for (const r of dreDB) {
        const key = `${r.ano}-${r.mes}`;
        if (!byKey[key]) byKey[key] = { ano: r.ano, mes: r.mes, fat: 0, desp: 0, lucro: 0 };
        byKey[key].fat   += Number(r.faturamento_total) || 0;
        byKey[key].desp  += Number(r.despesas_total)    || 0;
        byKey[key].lucro += Number(r.lucro)             || 0;
      }
      rows = Object.values(byKey).sort((a, b) => a.ano !== b.ano ? a.ano - b.ano : a.mes - b.mes);
    }
    const anos = [...new Set(rows.map(r => r.ano))];
    const multiAno = anos.length > 1;
    return rows.map(r => ({
      mes: multiAno ? `${MESES[r.mes]}/${String(r.ano).slice(2)}` : MESES[r.mes],
      Faturamento: r.fat, Despesas: r.desp, Lucro: r.lucro,
    }));
  }, [dreDB, filtroUnidade]);

  // 2g — pizza despesas (usa dreBase que já é filtrado por data+unidade)
  const pieData = [
    { name: 'Insumos',    value: dreBase.compraInsumos },
    { name: 'Folha',      value: dreBase.folhaPagamento },
    { name: 'Impostos',   value: dreBase.impostos },
    { name: 'ADM',        value: dreBase.despesasAdm },
    { name: 'Manutenção', value: dreBase.manutencao },
    { name: 'Pró Labore', value: dreBase.proLabore },
    { name: 'Sócio',      value: dreBase.retiraSocio },
  ].filter(d => d.value > 0);

  // Curva ABC de boletos (por fornecedor, responde a período + unidade)
  const curvaBoletos = useMemo(() => {
    const filtered = (filtroUnidade === 'todas' ? boletosDB : boletosDB.filter(b => b.unidade_id === filtroUnidade))
      .filter(b => {
        if (!b.vencimento) return false;
        const [y, m] = (b.vencimento as string).split('-').map(Number);
        return y === anoRange && (m - 1) >= mesInicio && (m - 1) <= mesFim;
      });
    const agrupado: Record<string, number> = {};
    for (const b of filtered) {
      const key = (b.fornecedor as string)?.trim() || (b.categoria as string) || 'Outros';
      agrupado[key] = (agrupado[key] || 0) + (Number(b.valor) || 0);
    }
    return buildCurvaABC(Object.entries(agrupado).map(([nome, total]) => ({ nome, total })));
  }, [boletosDB, filtroUnidade, anoRange, mesInicio, mesFim]);

  // Curva ABC de compras/insumos (por categoria, responde a período + unidade)
  const curvaCompras = useMemo(() => {
    const filtered = (filtroUnidade === 'todas' ? comprasDB : comprasDB.filter(c => c.unidade_id === filtroUnidade))
      .filter(c => {
        if (!c.data) return false;
        const [y, m] = (c.data as string).split('-').map(Number);
        return y === anoRange && (m - 1) >= mesInicio && (m - 1) <= mesFim;
      });
    const agrupado: Record<string, number> = {};
    for (const c of filtered) {
      const key = (c.categoria as string)?.trim() || 'Outros';
      agrupado[key] = (agrupado[key] || 0) + (Number(c.valor_total) || 0);
    }
    return buildCurvaABC(Object.entries(agrupado).map(([nome, total]) => ({ nome, total })));
  }, [comprasDB, filtroUnidade, anoRange, mesInicio, mesFim]);

  // Alerta de preços: variação do preço unitário por produto (de comprasDB)
  const alertasPrecoReal = useMemo(() => {
    const filtered = filtroUnidade === 'todas' ? comprasDB : comprasDB.filter(c => c.unidade_id === filtroUnidade);
    const byProduto: Record<string, { mesKey: string; preco: number }[]> = {};
    for (const c of filtered) {
      if (!c.produto || !c.valor_unitario || !c.data) continue;
      const [y, m] = (c.data as string).split('-').map(Number);
      const mesKey = `${y}-${String(m - 1).padStart(2, '0')}`;
      const prod = (c.produto as string).trim();
      if (!byProduto[prod]) byProduto[prod] = [];
      byProduto[prod].push({ mesKey, preco: Number(c.valor_unitario) || 0 });
    }
    const alertas: { produto: string; fornecedor: string; precoAnterior: number; precoAtual: number; varPct: number; historico: { mes: string; preco: number }[] }[] = [];
    for (const [produto, entradas] of Object.entries(byProduto)) {
      const byMes: Record<string, number[]> = {};
      for (const e of entradas) {
        if (!byMes[e.mesKey]) byMes[e.mesKey] = [];
        byMes[e.mesKey].push(e.preco);
      }
      const sorted = Object.entries(byMes)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, precos]) => {
          const [y, m0] = key.split('-').map(Number);
          return { mes: `${MESES[m0]}/${String(y).slice(2)}`, preco: precos.reduce((a, b) => a + b, 0) / precos.length };
        });
      if (sorted.length < 2) continue;
      const precoAtual = sorted.at(-1)!.preco;
      const precoAnterior = sorted.slice(0, -1).reduce((a, b) => a + b.preco, 0) / (sorted.length - 1);
      if (precoAnterior <= 0) continue;
      const varPct = ((precoAtual - precoAnterior) / precoAnterior) * 100;
      if (varPct > 3) alertas.push({ produto, fornecedor: '', precoAnterior, precoAtual, varPct, historico: sorted });
    }
    return alertas.sort((a, b) => b.varPct - a.varPct).slice(0, 5);
  }, [comprasDB, filtroUnidade]);

  // Subcategorias reais para expansão da DRE
  function getSubcatsReais(catKey: string, catNome: string, unitId: string): { nome: string; porMes: number[]; total: number }[] {
    const dreData = unitId === 'todas' ? dreMensal : (drePorUnidade[unitId] ?? []);
    const mesesBase = dreData.map(m => MESES.indexOf(m.mes)).filter(m => m >= 0);
    const items: { sub: string; mes: number; val: number }[] = [];

    if (catKey === 'compraInsumos') {
      const fonte = unitId !== 'todas' ? comprasDB.filter(c => c.unidade_id === unitId) : comprasDB;
      for (const c of fonte) {
        const mes = new Date((c.data as string) + 'T12:00:00').getMonth();
        if (!mesesBase.includes(mes)) continue;
        items.push({ sub: c.categoria || 'Outros', mes, val: Number(c.valor_total) || 0 });
      }
    } else {
      const fonte = unitId !== 'todas' ? boletosDB.filter(b => b.unidade_id === unitId) : boletosDB;
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

  const unidadesParaDRE = filtroUnidade === 'todas' ? unidades : unidades.filter(u => u.id === filtroUnidade);

  return (
    <>
      <Header title="Indicadores" />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ── KPI Cards ──────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Resumo do período — {periodoLabel}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiIndicador label="Faturamento" value={dreBase.faturamentoTotal} prev={drePrev.faturamentoTotal} color="bg-amber-50"   icon={<DollarSign size={18} className="text-amber-600" />} />
            <KpiIndicador label="Despesas"    value={dreBase.despesasTotal}    prev={drePrev.despesasTotal}    color="bg-red-50"     icon={<TrendingDown size={18} className="text-red-500" />} />
            <KpiIndicador label="Lucro"       value={dreBase.lucro}            prev={drePrev.lucro}            color="bg-emerald-50" icon={<DollarSign size={18} className="text-emerald-600" />} />
            <KpiIndicador label="CMV"         value={dreBase.compraInsumos}    prev={drePrev.compraInsumos}    color="bg-blue-50"    icon={<ShoppingBag size={18} className="text-blue-600" />} />
          </div>
        </section>

        {/* ── Faturamento diário por unidade ─────────────────────── */}
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
              {unidadesDados.map((u, i) => (
                <Line key={u.id} type="monotone" dataKey={u.nome} stroke={CORES_UNIDADE[i % CORES_UNIDADE.length]} strokeWidth={2} dot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </section>

        {/* ── Média semanal por unidade ───────────────────────────── */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Média de Faturamento por Dia da Semana — {periodoLabelDiario}</h2>
          <p className="text-xs text-gray-400 mb-4">Média calculada sobre os dias do período com movimento registrado</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mediaSemanal} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(1)}k`} width={52} />
              <Tooltip formatter={(v) => typeof v === 'number' ? formatCurrency(v) : v} />
              <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              {unidadesDados.map((u, i) => (
                <Bar key={u.id} dataKey={u.nome} fill={CORES_UNIDADE[i % CORES_UNIDADE.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* ── Comparativo Anual por unidade ──────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Comparativo Anual — Faturamento {anoRange - 1} × {anoRange}</h2>
          <div className={`grid gap-4 ${comparativoPorUnidade.length > 1 ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
            {comparativoPorUnidade.map(c => (
              <div key={c.unidade.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold" style={{ color: c.cor }}>{c.unidade.nome}</h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.cresc >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {c.cresc >= 0 ? '+' : ''}{formatPercent(c.cresc)} vs {anoRange - 1}
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={c.data} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} width={40} />
                    <Tooltip formatter={(v) => typeof v === 'number' ? formatCurrency(v) : v} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey={String(anoRange - 1)} fill="#FDE68A" radius={[3, 3, 0, 0]} />
                    <Bar dataKey={String(anoRange)} fill={c.cor} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </section>

        {/* ── Evolução: Faturamento + Despesas + Lucro ───────────── */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Evolução: Faturamento, Despesas e Lucro</h2>
          <p className="text-xs text-gray-400 mb-4">
            {evolucao.length > 0
              ? `${evolucao[0].mes} → ${evolucao.at(-1)!.mes} · ${evolucao.length} meses`
              : 'Sem dados'} · três linhas no mesmo gráfico
          </p>
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

        {/* ── DRE — um por unidade (filtro de data ignorado; filtro ANUAL por ano) ── */}
        {unidadesParaDRE.map(u => {
          const dreData = drePorUnidade[u.id] ?? [];
          const unidKey = u.id;
          return (
            <section key={u.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    DRE — {u.nome} · Acumulado {anoRange} (Jan – {dreData.at(-1)?.mes ?? '…'})
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Período fixo: janeiro até o mês atual · clique em uma linha para ver subcategorias
                  </p>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                  {u.nome}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ minWidth: `${200 + dreData.length * 112 + 128 + 90}px` }}>
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide" style={{ minWidth: 200 }}>Linha DRE</th>
                      {dreData.map(m => (
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
                      {dreData.map(m => {
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
                        {formatCurrency(dreData.reduce((a, m) => a + m.faturamentoTotal, 0))}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-300 text-xs">—</td>
                    </tr>
                    {/* Despesas linha a linha */}
                    {dreLinhas.map(linha => {
                      const vals = dreData.map(m => m[linha.key] as number);
                      const total = vals.reduce((a, v) => a + v, 0);
                      if (total === 0) return null;
                      const subcatsReais = linha.catNome ? getSubcatsReais(linha.key, linha.catNome, u.id) : [];
                      const hasExpand = subcatsReais.length > 0;
                      const expandKey = `${u.id}:${linha.key}`;
                      const expanded = dreExpanded.has(expandKey);
                      const totalFatAcum = dreData.reduce((a, m) => a + m.faturamentoTotal, 0);
                      const metaPct = getMetaDesp(linha.key, anoRange, unidKey);
                      const atualPct = totalFatAcum > 0 ? (total / totalFatAcum) * 100 : 0;
                      const metaCell = metaPct !== null ? (() => {
                        const excedeu = atualPct > metaPct;
                        const proximo = !excedeu && atualPct >= metaPct * 0.85;
                        const [bg, fg] = excedeu ? ['bg-red-50', 'text-red-700'] : proximo ? ['bg-amber-50', 'text-amber-700'] : ['bg-emerald-50', 'text-emerald-700'];
                        return (
                          <td className={`px-3 py-2.5 text-center text-xs font-semibold tabular-nums ${bg} ${fg} whitespace-nowrap`}>
                            <div className="flex flex-col items-center leading-tight">
                              <span>{atualPct.toFixed(1)}%</span>
                              <span className="text-[9px] opacity-70 font-normal">{excedeu ? '↑' : '✓'} meta {metaPct}%</span>
                            </div>
                          </td>
                        );
                      })() : <td className="px-3 py-2.5 text-center text-gray-300 text-xs">—</td>;

                      return [
                        <tr
                          key={expandKey}
                          className={`border-b border-gray-50 hover:bg-gray-50 ${hasExpand ? 'cursor-pointer' : ''} ${expanded ? 'bg-gray-50' : ''}`}
                          onClick={() => hasExpand && toggleDre(expandKey)}
                        >
                          <td className="px-5 py-2.5 text-gray-700">
                            <span className="flex items-center gap-2">
                              {hasExpand ? (
                                expanded ? <ChevronDown size={14} className="text-amber-600 flex-shrink-0" /> : <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
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
                            const m = dreData[i];
                            const metaPctM = getMetaDesp(linha.key, anoRange, unidKey);
                            const atualPctM = m.faturamentoTotal > 0 ? (v / m.faturamentoTotal) * 100 : null;
                            const cor = (metaPctM === null || atualPctM === null) ? null
                              : atualPctM <= metaPctM ? 'text-emerald-600'
                              : atualPctM <= metaPctM * 1.15 ? 'text-amber-600'
                              : 'text-red-600';
                            return (
                              <td key={i} className="px-3 py-2.5 text-right text-gray-600 tabular-nums text-xs whitespace-nowrap">
                                {formatCurrency(v)}
                                {cor && atualPctM !== null && (
                                  <span className={`block text-[9px] font-semibold leading-none mt-0.5 ${cor}`}>
                                    {atualPctM <= (metaPctM ?? 0) ? '✓' : '↑'} {atualPctM.toFixed(1)}%
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
                        ...(expanded ? subcatsReais.map(s => (
                          <tr key={`${expandKey}-${s.nome}`} className="border-b border-gray-50 bg-gray-50/60">
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
                        )) : []),
                      ];
                    })}
                    {/* Total despesas */}
                    <tr className="border-t-2 border-gray-200 bg-red-50">
                      <td className="px-5 py-3 font-semibold text-gray-900 pl-8">Total de Despesas</td>
                      {dreData.map(m => (
                        <td key={m.mes} className="px-3 py-3 text-right font-medium text-red-700 tabular-nums text-xs whitespace-nowrap">
                          {formatCurrency(m.despesasTotal)}
                        </td>
                      ))}
                      <td className="px-5 py-3 text-right font-bold text-red-700 tabular-nums bg-red-50/60 whitespace-nowrap">
                        {formatCurrency(dreData.reduce((a, m) => a + m.despesasTotal, 0))}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-300 text-xs">—</td>
                    </tr>
                    {/* Resultado */}
                    <tr className="border-t-2 border-gray-200">
                      <td className="px-5 py-3 font-bold text-gray-900 bg-emerald-50">Resultado</td>
                      {dreData.map(m => {
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
                        const totalLucro = dreData.reduce((a, m) => a + m.lucro, 0);
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
          );
        })}

        {/* ── Pizza + Curva ABC (Boletos e Compras) ──────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Pizza despesas */}
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Despesas por Categoria — {periodoLabel}</h2>
            {pieData.length === 0 ? (
              <p className="text-sm text-gray-400">Sem dados no período.</p>
            ) : (
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
            )}
          </section>

          {/* Curva ABC — Boletos (por fornecedor) */}
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Curva ABC — Boletos / Despesas</h2>
              <p className="text-xs text-gray-400 mt-0.5">Por fornecedor · {periodoLabel}</p>
            </div>
            {curvaBoletos.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">Sem dados no período.</div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Fornecedor / Categoria', 'Total', '% Acum.', 'Classe'].map(h => (
                      <th key={h} className="px-4 py-2 text-left font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {curvaBoletos.filter(x => x.classe !== 'C').map(item => (
                    <tr key={item.nome} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-900">{item.nome}</td>
                      <td className="px-4 py-2 font-semibold text-gray-800 tabular-nums">{formatCurrency(item.total)}</td>
                      <td className="px-4 py-2 text-gray-600 tabular-nums">{formatPercent(item.pctAcum)}</td>
                      <td className="px-4 py-2">
                        <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${item.classe === 'A' ? 'bg-red-100 text-red-700 ring-1 ring-red-600/20' : 'bg-amber-100 text-amber-700 ring-1 ring-amber-600/20'}`}>
                          {item.classe}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>

        {/* Curva ABC — Compras / Insumos */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Curva ABC — Compras / Insumos</h2>
            <p className="text-xs text-gray-400 mt-0.5">Por categoria de compra · {periodoLabel} · exibindo classes A e B</p>
          </div>
          {curvaCompras.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">Sem dados no período.</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Categoria', 'Total', '% Acum.', 'Classe'].map(h => (
                    <th key={h} className="px-4 py-2 text-left font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {curvaCompras.filter(x => x.classe !== 'C').map(item => (
                  <tr key={item.nome} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-900">{item.nome}</td>
                    <td className="px-4 py-2 font-semibold text-gray-800 tabular-nums">{formatCurrency(item.total)}</td>
                    <td className="px-4 py-2 text-gray-600 tabular-nums">{formatPercent(item.pctAcum)}</td>
                    <td className="px-4 py-2">
                      <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${item.classe === 'A' ? 'bg-red-100 text-red-700 ring-1 ring-red-600/20' : 'bg-amber-100 text-amber-700 ring-1 ring-amber-600/20'}`}>
                        {item.classe}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* ── Acompanhamento de Metas ────────────────────────────── */}
        {(() => {
          const unidKey = filtroUnidade === 'todas' ? 'todas' : filtroUnidade;
          const nMeses  = mesFim - mesInicio + 1;
          const isAnual = nMeses >= 12;
          const periodoLabelMeta = periodoLabel;
          const tipoLabel = nMeses === 1 ? 'mensal' : isAnual ? 'anual' : `${nMeses} meses`;

          // Grupo 1: Metas anuais (usa dreMensalBase — ignora filtro de mês)
          const realizadoFatAnual   = dreMensalBase.reduce((a, m) => a + m.faturamentoTotal, 0);
          const realizadoLucroAnual = dreMensalBase.reduce((a, m) => a + m.lucro, 0);
          const metaFatAnual   = getMetaFat('anual', anoRange, unidKey);
          const metaLucroAnual = getMetaLucro('anual', anoRange, unidKey);

          const despCatsAnual = DEFAULT_DESP.map(d => {
            const metaPct  = getMetaDesp(d.categoriaKey, anoRange, unidKey);
            const despTotal = dreMensalBase.reduce((a, m) => a + ((m[d.categoriaKey as keyof typeof m] as number) ?? 0), 0);
            const atualPct = realizadoFatAnual > 0 ? (despTotal / realizadoFatAnual) * 100 : 0;
            return { ...d, metaPct, atualPct };
          }).filter(d => d.metaPct !== null && d.metaPct! > 0);

          // Grupo 2: Metas do período (usa dreDB filtrado por data)
          const mesesRange = (filtroUnidade === 'todas' ? dreDB : dreDB.filter(r => r.unidade_id === filtroUnidade))
            .filter(r => r.ano === anoRange && r.mes >= mesInicio && r.mes <= mesFim)
            .map(mapDre);
          const realizadoFat   = mesesRange.reduce((a, m) => a + m.faturamentoTotal, 0);
          const realizadoLucro = mesesRange.reduce((a, m) => a + m.lucro, 0);
          const metaFatPeriodo   = isAnual ? getMetaFat('anual', anoRange, unidKey)   : getMetaFat('mensal', anoRange, unidKey)   * nMeses;
          const metaLucroPeriodo = isAnual ? getMetaLucro('anual', anoRange, unidKey) : getMetaLucro('mensal', anoRange, unidKey) * nMeses;

          const g1Fat = metaFatAnual > 0, g1Lucro = metaLucroAnual > 0, g1Desp = despCatsAnual.length > 0;
          const g2Fat = metaFatPeriodo > 0, g2Lucro = metaLucroPeriodo > 0;
          if (!g1Fat && !g1Lucro && !g1Desp && !g2Fat && !g2Lucro) return null;

          return (
            <section className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-7">
                <Target size={15} className="text-amber-600" />
                <h2 className="text-sm font-semibold text-gray-900">Acompanhamento de Metas</h2>
              </div>

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
                    Não se altera ao mudar o período do filtro · acumulado Jan–{dreMensalBase.at(-1)?.mes ?? '…'} vs meta anual
                  </p>
                  {(g1Fat || g1Lucro) && (
                    <div className="flex flex-wrap gap-6 justify-around mb-6">
                      {g1Fat  && <MetaGauge titulo={`Faturamento Acumulado ${anoRange}`} valor={realizadoFatAnual}   meta={metaFatAnual}   tipo="faturamento" />}
                      {g1Lucro && <MetaGauge titulo={`Lucro Acumulado ${anoRange}`}       valor={realizadoLucroAnual} meta={metaLucroAnual} tipo="lucro" />}
                    </div>
                  )}
                  {g1Desp && (
                    <div className={(g1Fat || g1Lucro) ? 'border-t border-gray-100 pt-6' : ''}>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-5 text-center">
                        Despesas por Categoria — % máx. do faturamento acumulado
                      </p>
                      <div className="flex flex-wrap gap-6 justify-around">
                        {despCatsAnual.map(d => (
                          <MetaGauge key={d.categoriaKey} titulo={d.categoriaNome} valor={d.atualPct} meta={d.metaPct!} tipo="despesa" unidade="percent" />
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

              {(g2Fat || g2Lucro) && (
                <div className={(g1Fat || g1Lucro || g1Desp) ? 'border-t-2 border-dashed border-gray-200 pt-8' : ''}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-amber-100" />
                    <span className="text-[11px] font-bold text-amber-700 uppercase tracking-widest px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-200">
                      Metas do Período — {periodoLabelMeta}
                    </span>
                    <div className="flex-1 h-px bg-amber-100" />
                  </div>
                  <p className="text-xs text-gray-400 text-center mb-6">
                    {tipoLabel === 'mensal' ? 'Meta mensal · muda conforme o período selecionado' : `Meta mensal × ${nMeses} · muda conforme o período selecionado`}
                  </p>
                  <div className="flex flex-wrap gap-6 justify-around">
                    {g2Fat   && <MetaGauge titulo={`Faturamento · ${periodoLabelMeta}`} valor={realizadoFat}   meta={metaFatPeriodo}   tipo="faturamento" />}
                    {g2Lucro && <MetaGauge titulo={`Lucro · ${periodoLabelMeta}`}        valor={realizadoLucro} meta={metaLucroPeriodo} tipo="lucro" />}
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

        {/* ── Alerta de Alta de Preços ───────────────────────────── */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Alerta de Alta de Preços de Insumos</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {alertasPrecoReal.length > 0
                  ? `${alertasPrecoReal.length} insumo${alertasPrecoReal.length !== 1 ? 's' : ''} com aumento identificado · clique para ver histórico`
                  : 'Nenhum alerta de preço identificado — dados de compras podem não conter preço unitário'}
              </p>
            </div>
          </div>
          {alertasPrecoReal.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">
              Sem alertas no período. Verifique se as compras foram lançadas com valor unitário.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {alertasPrecoReal.map(alerta => {
                const aberto = alertaAberto === alerta.produto;
                return (
                  <div key={alerta.produto}>
                    <button
                      onClick={() => setAlertaAberto(aberto ? null : alerta.produto)}
                      className="w-full px-5 py-3.5 flex items-center gap-4 hover:bg-amber-50/40 transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{alerta.produto}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs">
                          <span className="text-gray-400">Média anterior: <strong className="text-gray-600">R$ {alerta.precoAnterior.toFixed(2)}</strong></span>
                          <span className="text-gray-300">→</span>
                          <span className="text-gray-400">Último: <strong className="text-gray-800">R$ {alerta.precoAtual.toFixed(2)}</strong></span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg flex-shrink-0">
                        +{alerta.varPct.toFixed(1)}%
                      </span>
                      {aberto ? <ChevronDown size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />}
                    </button>
                    {aberto && alerta.historico.length > 1 && (
                      <div className="px-5 pb-4 pt-1 bg-amber-50/30">
                        <p className="text-xs text-gray-500 mb-2">Evolução do preço médio unitário (R$/un)</p>
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
          )}
        </section>

      </main>
    </>
  );
}
