'use client';

import Header from '@/components/layout/Header';
import KpiCard from '@/components/ui/KpiCard';
import RevenueLineChart from '@/components/charts/RevenueLineChart';
import ExpensePieChart from '@/components/charts/ExpensePieChart';
import {
  dreMensal, dreAtual, dreMesAnterior,
  dreAtualU1, dreAtualU2,
  insights, meiosPagamento, unidadesPadaria,
} from '@/lib/mock-data';
import { formatCurrency, calcVariation, formatPercent, calcPercent } from '@/lib/utils';
import { useUnit } from '@/contexts/UnitContext';
import { useMetas } from '@/contexts/MetasContext';
import { useDateRange } from '@/contexts/DateRangeContext';
import { DollarSign, ShoppingBag, TrendingUp, AlertTriangle, CheckCircle, Info, Building2, Target } from 'lucide-react';
import { MetaGauge } from '@/components/ui/MetaGauge';

const insightIconMap = {
  alerta:   { Icon: AlertTriangle, bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-100' },
  atencao:  { Icon: Info,          bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-100' },
  positivo: { Icon: CheckCircle,   bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
};

export default function DashboardPage() {
  const { filtroUnidade } = useUnit();
  const { getMetaFat, getMetaLucro } = useMetas();
  const { mesInicio, mesFim, ano } = useDateRange();

  const dreBase    = filtroUnidade === '1' ? dreAtualU1 : filtroUnidade === '2' ? dreAtualU2 : dreAtual;
  const dreBaseAnt = filtroUnidade === '1' ? dreMensal.at(-2)! : filtroUnidade === '2' ? dreMensal.at(-2)! : dreMesAnterior;

  const varFaturamento = calcVariation(dreBase.faturamentoTotal, dreBaseAnt.faturamentoTotal);
  const varDespesas    = calcVariation(dreBase.despesasTotal, dreBaseAnt.despesasTotal);
  const varCompras     = calcVariation(dreBase.compraInsumos, dreBaseAnt.compraInsumos);
  const varLucro       = calcVariation(dreBase.lucro, dreBaseAnt.lucro);

  const destaques = insights.slice(0, 3);

  const unidadesComparativo = [
    {
      unidade: unidadesPadaria[0],
      dre: dreAtualU1,
      cor: '#D97706',
    },
    {
      unidade: unidadesPadaria[1],
      dre: dreAtualU2,
      cor: '#3B82F6',
    },
  ];

  return (
    <>
      <Header title="Resumo" />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* KPI Cards — Consolidado */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Consolidado — Junho 2026</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              title="Faturamento"
              value={dreBase.faturamentoTotal}
              variation={varFaturamento}
              iconBg="bg-amber-50"
              icon={<DollarSign size={20} className="text-amber-600" />}
            />
            <KpiCard
              title="Despesas Totais"
              value={dreBase.despesasTotal}
              variation={varDespesas}
              iconBg="bg-red-50"
              icon={<TrendingUp size={20} className="text-red-500" />}
            />
            <KpiCard
              title="Compra de Insumos"
              value={dreBase.compraInsumos}
              variation={varCompras}
              iconBg="bg-blue-50"
              icon={<ShoppingBag size={20} className="text-blue-500" />}
            />
            <KpiCard
              title="Lucro do Período"
              value={dreBase.lucro}
              variation={varLucro}
              iconBg="bg-emerald-50"
              icon={<DollarSign size={20} className="text-emerald-600" />}
            />
          </div>
        </div>

        {/* Comparativo por unidade */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Comparativo entre Unidades — Junho</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {unidadesComparativo.map(({ unidade, dre, cor }) => {
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
                      { label: 'Lucro',        value: formatCurrency(dre.lucro), color: dre.lucro >= 0 ? 'text-emerald-600' : 'text-red-600' },
                      { label: 'Margem Liq.',  value: formatPercent(margem), color: margem >= 10 ? 'text-emerald-600' : 'text-amber-600' },
                      { label: 'CMV %',        value: formatPercent(cmv), color: cmv <= 40 ? 'text-emerald-600' : 'text-red-600' },
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
                        {formatPercent(calcPercent(dre.faturamentoTotal, dreAtual.faturamentoTotal))}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${calcPercent(dre.faturamentoTotal, dreAtual.faturamentoTotal)}%`,
                          backgroundColor: cor,
                        }}
                      />
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
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Evolução Financeira — Jan a Jun 2026</h2>
            <RevenueLineChart data={dreMensal} />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Despesas por Categoria — Jun</h2>
            <ExpensePieChart data={dreAtual} />
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Meios de Pagamento — Jun</h2>
            <div className="space-y-3">
              {meiosPagamento.map((mp) => {
                const pct = ((mp.valor / dreAtual.faturamentoTotal) * 100).toFixed(1);
                return (
                  <div key={mp.nome}>
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
        {/* ── Acompanhamento de Metas ──────────────────────── */}
        {(() => {
          const unidKey = filtroUnidade === '1' ? '1' : filtroUnidade === '2' ? '2' : 'todas';
          const nMeses  = mesFim - mesInicio + 1;
          const isAnual = nMeses >= 12;

          // Realizado no período selecionado (dreMensal = Jan(0)…Jun(5))
          const mesesRange = dreMensal.filter((_, i) => i >= mesInicio && i <= Math.min(mesFim, dreMensal.length - 1));
          const realizadoFat  = mesesRange.reduce((a, m) => a + m.faturamentoTotal, 0);
          const realizadoLucro = mesesRange.reduce((a, m) => a + m.lucro, 0);

          // Meta proporcional ao período
          const metaFatBase   = isAnual ? getMetaFat('anual', ano, unidKey) : getMetaFat('mensal', ano, unidKey) * nMeses;
          const metaLucroBase = isAnual ? getMetaLucro('anual', ano, unidKey) : getMetaLucro('mensal', ano, unidKey) * nMeses;

          const MESES_CURTO_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
          const periodoLabel = mesInicio === mesFim
            ? `${MESES_CURTO_PT[mesInicio]} ${ano}`
            : `${MESES_CURTO_PT[mesInicio]}–${MESES_CURTO_PT[mesFim]} ${ano}`;

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
