import Header from '@/components/layout/Header';
import { insights, analiseIA, dreAtual } from '@/lib/mock-data';
import { formatCurrency, formatPercent, calcPercent } from '@/lib/utils';
import { AlertTriangle, Info, CheckCircle, Sparkles, Activity } from 'lucide-react';
import type { TipoInsight } from '@/types';

const iconMap: Record<TipoInsight, { Icon: React.ElementType; bg: string; text: string; border: string; badge: string }> = {
  alerta: {
    Icon: AlertTriangle,
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
  },
  atencao: {
    Icon: Info,
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
  },
  positivo: {
    Icon: CheckCircle,
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
  },
};

const labelMap: Record<TipoInsight, string> = {
  alerta: 'Alerta',
  atencao: 'Atenção',
  positivo: 'Positivo',
};

function SaudeFinanceira() {
  const cmv = calcPercent(dreAtual.compraInsumos, dreAtual.faturamentoReal);
  const pessoal = calcPercent(dreAtual.folhaPagamento + dreAtual.proLabore, dreAtual.faturamentoReal);
  const margem = calcPercent(dreAtual.lucro, dreAtual.faturamentoReal);

  const items = [
    { label: 'CMV', valor: cmv, meta: 40, inverted: true },
    { label: 'Custo Pessoal', valor: pessoal, meta: 30, inverted: true },
    { label: 'Margem Líquida', valor: margem, meta: 10, inverted: false },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-amber-600" />
        <h2 className="text-sm font-semibold text-gray-900">Saúde Financeira — Junho</h2>
      </div>
      <div className="space-y-4">
        {items.map((item) => {
          const ok = item.inverted ? item.valor <= item.meta : item.valor >= item.meta;
          const pct = Math.min((item.valor / (item.meta * 1.5)) * 100, 100);
          return (
            <div key={item.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-gray-700">{item.label}</span>
                <span className={`font-semibold ${ok ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatPercent(item.valor)} {ok ? '✓' : '⚠'}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${ok ? 'bg-emerald-500' : 'bg-red-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Meta: {item.inverted ? 'abaixo de' : 'acima de'} {formatPercent(item.meta)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const alertas = insights.filter((i) => i.tipo === 'alerta');
  const atencoes = insights.filter((i) => i.tipo === 'atencao');
  const positivos = insights.filter((i) => i.tipo === 'positivo');

  const paragrafos = analiseIA.trim().split('\n\n').filter(Boolean);

  return (
    <>
      <Header title="Insights Financeiros" />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Summary counts */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{alertas.length}</p>
            <p className="text-xs font-medium text-red-600 mt-1">Alertas</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{atencoes.length}</p>
            <p className="text-xs font-medium text-amber-600 mt-1">Atenção</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{positivos.length}</p>
            <p className="text-xs font-medium text-emerald-600 mt-1">Positivos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Insights list */}
          <div className="xl:col-span-2 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Alertas e Análises Automáticas</h2>
            {insights.map((item) => {
              const { Icon, bg, text, border, badge } = iconMap[item.tipo];
              return (
                <div
                  key={item.id}
                  className={`flex gap-4 p-4 rounded-xl border ${bg} ${border}`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
                    <Icon size={18} className={text} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900">{item.titulo}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${badge}`}>
                        {labelMap[item.tipo]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{item.descricao}</p>
                    {item.valor && (
                      <p className={`text-xs font-bold mt-2 ${text}`}>{item.valor}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <SaudeFinanceira />

            {/* AI Analysis */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-amber-600" />
                <h2 className="text-sm font-semibold text-gray-900">Análise Inteligente</h2>
                <span className="text-[10px] bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">IA</span>
              </div>
              <div className="space-y-3 text-xs text-gray-700 leading-relaxed">
                {paragrafos.map((p, i) => {
                  const bold = p.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
                  return (
                    <p key={i} dangerouslySetInnerHTML={{ __html: bold }} />
                  );
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-[10px] text-gray-400">
                  Análise gerada automaticamente com base nos dados de Junho 2026. Resultados aproximados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
