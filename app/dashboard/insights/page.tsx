import Header from '@/components/layout/Header';
import { getInsights } from '@/lib/insights-service';
import { dreAtual } from '@/lib/mock-data';
import { formatPercent, calcPercent } from '@/lib/utils';
import { AlertTriangle, Info, CheckCircle, Sparkles, Activity } from 'lucide-react';
import type { TipoInsight, Insight } from '@/types';
import RefreshInsightsButton from './RefreshInsightsButton';

const iconMap: Record<TipoInsight, { Icon: React.ElementType; bg: string; text: string; border: string; badge: string }> = {
  alerta:   { Icon: AlertTriangle, bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-200',   badge: 'bg-red-100 text-red-700'   },
  atencao:  { Icon: Info,          bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },
  positivo: { Icon: CheckCircle,   bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
};

const labelMap: Record<TipoInsight, string> = {
  alerta: 'Alerta', atencao: 'Atenção', positivo: 'Positivo',
};

function SaudeFinanceira() {
  const cmv     = calcPercent(dreAtual.compraInsumos, dreAtual.faturamentoReal);
  const pessoal = calcPercent(dreAtual.folhaPagamento + dreAtual.proLabore, dreAtual.faturamentoReal);
  const margem  = calcPercent(dreAtual.lucro, dreAtual.faturamentoReal);

  const items = [
    { label: 'CMV',            valor: cmv,     meta: 40, inverted: true  },
    { label: 'Custo Pessoal',  valor: pessoal, meta: 28, inverted: true  },
    { label: 'Margem Líquida', valor: margem,  meta: 10, inverted: false },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-amber-600" />
        <h2 className="text-sm font-semibold text-gray-900">Saúde Financeira — Junho</h2>
      </div>
      <div className="space-y-4">
        {items.map(item => {
          const ok  = item.inverted ? item.valor <= item.meta : item.valor >= item.meta;
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
                <div className={`h-full rounded-full transition-all ${ok ? 'bg-emerald-500' : 'bg-red-500'}`}
                  style={{ width: `${pct}%` }} />
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

function InsightCard({ item }: { item: Insight }) {
  const { Icon, bg, text, border, badge } = iconMap[item.tipo];
  return (
    <div className={`flex gap-4 p-4 rounded-xl border ${bg} ${border}`}>
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
        {item.valor && <p className={`text-xs font-bold mt-2 ${text}`}>{item.valor}</p>}
      </div>
    </div>
  );
}

export default async function InsightsPage() {
  const { insights, analise, geradoEm, fonte } = await getInsights();

  const alertas   = insights.filter(i => i.tipo === 'alerta');
  const atencoes  = insights.filter(i => i.tipo === 'atencao');
  const positivos = insights.filter(i => i.tipo === 'positivo');
  const paragrafos = analise.trim().split('\n\n').filter(Boolean);

  const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(geradoEm));

  return (
    <>
      <Header title="Insights Financeiros" />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Contadores */}
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
          {/* Lista de insights */}
          <div className="xl:col-span-2 space-y-3">
            {/* Cabeçalho com metadados e botão */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-sm font-semibold text-gray-900">Alertas e Análises Automáticas</h2>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 leading-tight">
                    {fonte === 'claude' ? '✦ Gerado por Claude' : '⚠ Dados de demonstração'}
                  </p>
                  <p className="text-[10px] text-gray-400 leading-tight capitalize">{dataFormatada}</p>
                </div>
                <RefreshInsightsButton />
              </div>
            </div>

            {insights.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                Nenhum insight gerado ainda. Clique em &quot;Atualizar agora&quot; para gerar.
              </div>
            ) : (
              insights.map(item => <InsightCard key={item.id} item={item} />)
            )}
          </div>

          {/* Coluna direita */}
          <div className="space-y-4">
            <SaudeFinanceira />

            {/* Análise do Claude */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-amber-600" />
                <h2 className="text-sm font-semibold text-gray-900">Análise Inteligente</h2>
                <span className="text-[10px] bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">IA</span>
              </div>
              <div className="space-y-3 text-xs text-gray-700 leading-relaxed">
                {paragrafos.length > 0 ? paragrafos.map((p, i) => (
                  <p key={i} dangerouslySetInnerHTML={{ __html: p.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') }} />
                )) : (
                  <p className="text-gray-400 italic">Análise será exibida após a primeira geração.</p>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-[10px] text-gray-400">
                  {fonte === 'claude'
                    ? `Análise gerada por Claude · ${dataFormatada}`
                    : 'Análise de demonstração · configure ANTHROPIC_API_KEY para ativar'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
