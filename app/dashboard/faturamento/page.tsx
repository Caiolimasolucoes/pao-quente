'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { faturamentoDiario, unidadesPadaria } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';
import { Plus, Lock, TrendingUp, Building2, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { useUnit } from '@/contexts/UnitContext';
import { useFormasPagamento } from '@/contexts/FormasPagamentoContext';
import type { FaturamentoDia } from '@/types';

type Aba = 'lancamento' | 'historico' | 'sazonalidade';

const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function getDiaSemana(dataStr: string) {
  const [y, m, d] = dataStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

function formatDia(dataStr: string) {
  const [, , d] = dataStr.split('-');
  return `${parseInt(d)}/06`;
}

// Distribuição mockada de formas de pagamento no histórico (ratios fixos para o protótipo)
const DIST_FORMAS: Record<string, number> = {
  pix: 0.40, debito: 0.25, visa: 0.15, mastercard: 0.12, elo: 0.05, dinheiro: 0.03,
};

function calcFormaHistorico(
  total: number,
  formaId: string,
  idxForma: number,
  ativas: { id: string }[],
): number {
  if (total === 0) return 0;
  if (idxForma === ativas.length - 1) {
    const somaOutros = ativas.slice(0, -1).reduce(
      (s, f) => s + Math.round(total * (DIST_FORMAS[f.id] ?? 0)), 0,
    );
    return Math.max(0, total - somaOutros);
  }
  return Math.round(total * (DIST_FORMAS[formaId] ?? 0));
}

function MediaDiaSemana({ dados }: { dados: FaturamentoDia[] }) {
  const por: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  dados.filter((d) => d.valor > 0).forEach((d) => {
    por[getDiaSemana(d.data)].push(d.valor);
  });
  const medias = Object.entries(por).map(([dia, vals]) => ({
    dia: diasSemana[Number(dia)],
    media: vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0,
  }));
  const maxMedia = Math.max(...medias.map((m) => m.media));
  return (
    <div className="space-y-2">
      {medias.map(({ dia, media }) => (
        <div key={dia} className="flex items-center gap-3 text-xs">
          <span className="w-8 text-gray-500 font-medium">{dia}</span>
          <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
            <div
              className="h-full rounded transition-all"
              style={{ width: `${maxMedia > 0 ? (media / maxMedia) * 100 : 0}%`, backgroundColor: '#D97706' }}
            />
          </div>
          <span className="w-20 text-right text-gray-700 font-medium tabular-nums">
            {media > 0 ? formatCurrency(media) : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function FaturamentoPage() {
  const [aba, setAba] = useState<Aba>('lancamento');
  const { filtroUnidade } = useUnit();
  const [valorLancamento, setValorLancamento] = useState('');
  const [unidadeLancamento, setUnidadeLancamento] = useState<'1' | '2'>('1');
  const [valoresForma, setValoresForma] = useState<Record<string, string>>({});
  const { formas } = useFormasPagamento();
  const formasAtivas = formas.filter((f) => f.ativo);

  const totalNum = parseFloat(valorLancamento) || 0;
  const somaFormas = formasAtivas.reduce((sum, f) => sum + (parseFloat(valoresForma[f.id] || '0') || 0), 0);
  const diferenca = totalNum - somaFormas;
  const somaBate = totalNum > 0 && Math.abs(diferenca) < 0.01;

  const dadosFiltrados = filtroUnidade === 'todas'
    ? faturamentoDiario
    : faturamentoDiario.filter((d) => d.unidadeId === filtroUnidade);

  const totalMes = dadosFiltrados.filter((d) => d.valor > 0).reduce((a, b) => a + b.valor, 0);
  const hoje: FaturamentoDia[] = faturamentoDiario.filter((d) => d.data === '2026-06-18');
  const totalHoje = hoje.reduce((a, b) => a + b.valor, 0);

  // Média de faturamento: total ÷ dias com movimento
  const diasComMov = dadosFiltrados.filter((d) => d.valor > 0);
  const mediaFaturamento = diasComMov.length > 0 ? totalMes / diasComMov.length : 0;

  const diasMovU1 = faturamentoDiario.filter((d) => d.unidadeId === '1' && d.valor > 0);
  const mediaU1 = diasMovU1.length > 0
    ? diasMovU1.reduce((a, b) => a + b.valor, 0) / diasMovU1.length : 0;

  const diasMovU2 = faturamentoDiario.filter((d) => d.unidadeId === '2' && d.valor > 0);
  const mediaU2 = diasMovU2.length > 0
    ? diasMovU2.reduce((a, b) => a + b.valor, 0) / diasMovU2.length : 0;

  // Dias únicos com dados
  const diasUnicos = Array.from(new Set(faturamentoDiario.map((d) => d.data))).sort();

  // Agrupar por dia para tabela
  function valorDia(data: string, uid: '1' | '2') {
    return faturamentoDiario.find((d) => d.data === data && d.unidadeId === uid)?.valor ?? 0;
  }

  return (
    <>
      <Header title="Faturamento / Demanda" />
      <main className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Hoje — 18/06</p>
            <p className="text-[1.625rem] leading-none font-display italic text-gray-900">{formatCurrency(totalHoje)}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp size={12} className="text-emerald-500" />
              <span className="text-xs text-emerald-600">+8,3% vs. ontem</span>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Acumulado Junho (MTD)</p>
            <p className="text-[1.625rem] leading-none font-display italic text-gray-900">{formatCurrency(totalMes)}</p>
            <p className="text-xs text-gray-400 mt-1">18 dias lançados</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Meta do Mês</p>
            <p className="text-[1.625rem] leading-none font-display italic text-amber-600">{formatCurrency(34000)}</p>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${Math.min((totalMes / 34000) * 100, 100).toFixed(0)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{((totalMes / 34000) * 100).toFixed(0)}% da meta</p>
          </div>

          {/* Média de faturamento */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Média de Faturamento / Dia</p>
            {filtroUnidade === 'todas' ? (
              /* Quando "Todas as unidades" — mostra por unidade separadamente */
              <div className="space-y-2 mt-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                    <span className="text-[11px] text-gray-500 font-medium">Centro</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 tabular-nums">{formatCurrency(mediaU1)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    <span className="text-[11px] text-gray-500 font-medium">Bairro</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 tabular-nums">{formatCurrency(mediaU2)}</span>
                </div>
                <div className="pt-1 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">por dia c/ movimento</span>
                  <span className="text-[11px] text-gray-400">{diasMovU1.length}d / {diasMovU2.length}d</span>
                </div>
              </div>
            ) : (
              /* Quando uma unidade específica — valor único */
              <>
                <p className="text-[1.625rem] leading-none font-display italic text-gray-900">{formatCurrency(mediaFaturamento)}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {diasComMov.length} dia{diasComMov.length !== 1 ? 's' : ''} com movimento
                </p>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {([
            { key: 'lancamento', label: 'Lançamento do Dia' },
            { key: 'historico',  label: 'Histórico' },
            { key: 'sazonalidade', label: 'Sazonalidade' },
          ] as { key: Aba; label: string }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setAba(t.key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                aba === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Lançamento do Dia */}
        {aba === 'lancamento' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Lançar Faturamento — 18/06/2026</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Unidade</label>
                  <div className="grid grid-cols-2 gap-3">
                    {unidadesPadaria.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => setUnidadeLancamento(u.id)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                          unidadeLancamento === u.id
                            ? 'border-amber-500 bg-amber-50 text-amber-800'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <Building2 size={15} />
                        {u.nome}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Faturamento Total do Dia (R$)</label>
                  <input
                    type="number"
                    value={valorLancamento}
                    onChange={(e) => setValorLancamento(e.target.value)}
                    placeholder="0,00"
                    min={0}
                    step="0.01"
                    className="w-full px-4 py-3 text-xl font-bold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 tabular-nums"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">Valor total da caixa do dia — não discriminado por produto.</p>
                </div>

                {/* Distribuição por forma de pagamento — aparece quando há valor total */}
                {totalNum > 0 && (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                      <CreditCard size={14} className="text-gray-400" />
                      <span className="text-xs font-semibold text-gray-700">Distribuição por Forma de Pagamento</span>
                    </div>
                    <div className="p-4 space-y-3">
                      {formasAtivas.map((f) => (
                        <div key={f.id} className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: f.cor }}
                          />
                          <label className="text-xs font-medium text-gray-700 w-28 flex-shrink-0">{f.nome}</label>
                          <div className="flex-1 relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">R$</span>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={valoresForma[f.id] ?? ''}
                              onChange={(e) => setValoresForma((prev) => ({ ...prev, [f.id]: e.target.value }))}
                              placeholder="0,00"
                              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 tabular-nums"
                            />
                          </div>
                        </div>
                      ))}

                      {/* Indicador de fechamento */}
                      <div className={`flex items-center justify-between mt-2 pt-3 border-t rounded-lg px-3 py-2 ${
                        somaBate
                          ? 'bg-emerald-50 border-emerald-200'
                          : somaFormas > totalNum
                          ? 'bg-red-50 border-red-200'
                          : 'bg-amber-50 border-amber-200'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          {somaBate ? (
                            <CheckCircle2 size={14} className="text-emerald-600" />
                          ) : (
                            <AlertCircle size={14} className={somaFormas > totalNum ? 'text-red-500' : 'text-amber-500'} />
                          )}
                          <span className={`text-xs font-medium ${
                            somaBate ? 'text-emerald-700' : somaFormas > totalNum ? 'text-red-700' : 'text-amber-700'
                          }`}>
                            {somaBate
                              ? 'Total fechado!'
                              : somaFormas > totalNum
                              ? `Excede em R$ ${(somaFormas - totalNum).toFixed(2).replace('.', ',')}`
                              : `Falta distribuir R$ ${diferenca.toFixed(2).replace('.', ',')}`}
                          </span>
                        </div>
                        <span className="text-xs tabular-nums text-gray-500">
                          {somaFormas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / {totalNum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <Lock size={14} className="text-amber-600 flex-shrink-0" />
                  <p className="text-xs text-amber-700">
                    Após salvar, o histórico fica disponível somente para usuários com permissão de <strong>Ver histórico de faturamento</strong>.
                  </p>
                </div>
                <button
                  disabled={totalNum > 0 && !somaBate}
                  className={`w-full py-3 text-sm font-semibold text-white rounded-lg transition-colors ${
                    totalNum > 0 && !somaBate ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  style={{ backgroundColor: '#D97706' }}
                >
                  {totalNum > 0 && !somaBate ? 'Distribua o valor por forma de pagamento' : 'Salvar Faturamento'}
                </button>
              </div>
            </div>

            {/* Today's snapshot */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Hoje nas Unidades — 18/06</h2>
              <div className="space-y-4">
                {unidadesPadaria.map((u) => {
                  const lancado = faturamentoDiario.find((d) => d.data === '2026-06-18' && d.unidadeId === u.id);
                  return (
                    <div key={u.id} className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Building2 size={14} className="text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">{u.nome}</span>
                        </div>
                        {lancado && lancado.valor > 0 ? (
                          <span className="text-xs bg-emerald-100 text-emerald-700 font-medium px-2 py-0.5 rounded-full">Lançado</span>
                        ) : (
                          <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">Pendente</span>
                        )}
                      </div>
                      <p className="text-[1.625rem] leading-none font-display italic text-gray-900">
                        {lancado && lancado.valor > 0 ? formatCurrency(lancado.valor) : '—'}
                      </p>
                    </div>
                  );
                })}
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
                  <p className="text-xs text-gray-500 mb-1">Total do dia (consolidado)</p>
                  <p className="text-[1.625rem] leading-none font-display italic text-amber-800">{formatCurrency(totalHoje)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Histórico */}
        {aba === 'historico' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-sm font-semibold text-gray-900">Histórico de Lançamentos — Junho 2026</h2>
              {filtroUnidade !== 'todas' && (
                <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                  <Building2 size={12} /> {filtroUnidade === '1' ? 'Centro' : 'Bairro'}
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: `${560 + formasAtivas.length * 110}px` }}>
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Data</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Dia</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Centro</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Bairro</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-amber-50">Total</th>
                    {formasAtivas.map((f) => (
                      <th
                        key={f.id}
                        className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                      >
                        <span className="inline-flex items-center justify-end gap-1">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: f.cor }} />
                          {f.nome}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {diasUnicos.map((data) => {
                    const v1 = valorDia(data, '1');
                    const v2 = valorDia(data, '2');
                    const total = v1 + v2;
                    const ds = diasSemana[getDiaSemana(data)];
                    const isDom = getDiaSemana(data) === 0;
                    return (
                      <tr key={data} className={`hover:bg-gray-50 transition-colors ${isDom ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-2.5 text-gray-700 font-medium">{formatDia(data)}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${isDom ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                            {ds}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">
                          {v1 > 0 ? formatCurrency(v1) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">
                          {v2 > 0 ? formatCurrency(v2) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-gray-900 bg-amber-50">
                          {total > 0 ? formatCurrency(total) : <span className="text-gray-300">—</span>}
                        </td>
                        {formasAtivas.map((f, idx) => {
                          const vf = calcFormaHistorico(total, f.id, idx, formasAtivas);
                          return (
                            <td key={f.id} className="px-3 py-2.5 text-right tabular-nums text-gray-600 text-xs whitespace-nowrap">
                              {total > 0 ? (
                                <span style={{ color: vf > 0 ? f.cor : undefined }} className={vf > 0 ? 'font-medium' : 'text-gray-300'}>
                                  {vf > 0 ? formatCurrency(vf) : '—'}
                                </span>
                              ) : <span className="text-gray-300">—</span>}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-amber-50">
                    <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-900">Total do período</td>
                    <td className="px-4 py-3 text-right tabular-nums text-sm font-bold text-amber-800">
                      {formatCurrency(faturamentoDiario.filter((d) => d.unidadeId === '1').reduce((a, b) => a + b.valor, 0))}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-sm font-bold text-amber-800">
                      {formatCurrency(faturamentoDiario.filter((d) => d.unidadeId === '2').reduce((a, b) => a + b.valor, 0))}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-sm font-bold text-amber-800">
                      {formatCurrency(faturamentoDiario.reduce((a, b) => a + b.valor, 0))}
                    </td>
                    {formasAtivas.map((f, idx) => {
                      const totalForma = diasUnicos.reduce((sum, data) => {
                        const rowTotal = valorDia(data, '1') + valorDia(data, '2');
                        return sum + calcFormaHistorico(rowTotal, f.id, idx, formasAtivas);
                      }, 0);
                      return (
                        <td key={f.id} className="px-3 py-3 text-right tabular-nums text-sm font-bold text-amber-800 whitespace-nowrap">
                          {formatCurrency(totalForma)}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Sazonalidade */}
        {aba === 'sazonalidade' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {unidadesPadaria.map((u) => (
              <div key={u.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 size={15} className="text-amber-600" />
                  <h2 className="text-sm font-semibold text-gray-900">{u.nome} — Média por Dia da Semana</h2>
                </div>
                <MediaDiaSemana dados={faturamentoDiario.filter((d) => d.unidadeId === u.id)} />
              </div>
            ))}
            <div className="xl:col-span-2 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-800 mb-1">Insight de sazonalidade</p>
              <p className="text-xs text-amber-700">
                Em ambas as unidades, <strong>sexta e sábado</strong> são os dias de maior faturamento médio. O <strong>domingo</strong> é dia de folga (fechado). A <strong>segunda-feira</strong> apresenta o menor movimento — considere promoções para aumentar o movimento no início da semana.
              </p>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
