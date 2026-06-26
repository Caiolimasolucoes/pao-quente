'use client';

import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/layout/Header';
import { formatCurrency } from '@/lib/utils';
import { Lock, TrendingUp, Building2, CreditCard, CheckCircle2, AlertCircle, Pencil } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useUnit } from '@/contexts/UnitContext';
import { useDateRange } from '@/contexts/DateRangeContext';
import { useFormasPagamento } from '@/contexts/FormasPagamentoContext';
import { createClient } from '@/lib/supabase/client';

type Aba = 'lancamento' | 'historico' | 'sazonalidade';

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const CORES_UNIDADE = ['#D97706', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444'];

const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function getDiaSemana(dataStr: string) {
  const [y, m, d] = dataStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

function formatDia(dataStr: string) {
  const [, m, d] = dataStr.split('-');
  return `${parseInt(d)}/${m}`;
}

const DIST_FORMAS: Record<string, number> = {
  pix: 0.40, debito: 0.25, visa: 0.15, mastercard: 0.12, elo: 0.05, dinheiro: 0.03,
};

function calcFormaHistorico(total: number, formaId: string, idxForma: number, ativas: { id: string }[]): number {
  if (total === 0) return 0;
  if (idxForma === ativas.length - 1) {
    const somaOutros = ativas.slice(0, -1).reduce((s, f) => s + Math.round(total * (DIST_FORMAS[f.id] ?? 0)), 0);
    return Math.max(0, total - somaOutros);
  }
  return Math.round(total * (DIST_FORMAS[formaId] ?? 0));
}

function MediaDiaSemana({ dados }: { dados: { data: string; valor: number }[] }) {
  const por: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  dados.filter(d => d.valor > 0).forEach(d => { por[getDiaSemana(d.data)].push(d.valor); });
  const medias = Object.entries(por).map(([dia, vals]) => ({
    dia: diasSemana[Number(dia)],
    media: vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0,
  }));
  const maxMedia = Math.max(...medias.map(m => m.media));
  return (
    <div className="space-y-2">
      {medias.map(({ dia, media }) => (
        <div key={dia} className="flex items-center gap-3 text-xs">
          <span className="w-8 text-gray-500 font-medium">{dia}</span>
          <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
            <div className="h-full rounded transition-all" style={{ width: `${maxMedia > 0 ? (media / maxMedia) * 100 : 0}%`, backgroundColor: '#D97706' }} />
          </div>
          <span className="w-20 text-right text-gray-700 font-medium tabular-nums">{media > 0 ? formatCurrency(media) : '—'}</span>
        </div>
      ))}
    </div>
  );
}

export default function FaturamentoPage() {
  const [aba, setAba]                   = useState<Aba>('lancamento');
  const { filtroUnidade, unidades }      = useUnit();
  const { mesInicio, mesFim, ano }       = useDateRange();
  const [valorLancamento, setValorLancamento] = useState('');
  const [unidadeLancamento, setUnidadeLancamento] = useState('1');
  const [dataLancamento, setDataLancamento]   = useState('');
  const [valoresForma, setValoresForma] = useState<Record<string, string>>({});
  const [salvando, setSalvando]         = useState(false);
  const [sucesso, setSucesso]           = useState('');
  const [erroSalvar, setErroSalvar]     = useState('');
  const { formas } = useFormasPagamento();
  const formasAtivas = formas.filter(f => f.ativo);

  const [faturamentoData, setFaturamentoData] = useState<any[]>([]);
  const [carregando, setCarregando]           = useState(true);
  const [editandoFat, setEditandoFat]         = useState<any>(null);
  const [editFatValor, setEditFatValor]       = useState('');
  const [editFatMeios, setEditFatMeios]       = useState<Record<string, string>>({});
  const [salvandoEditFat, setSalvandoEditFat] = useState(false);

  const hoje = new Date().toISOString().split('T')[0];

  useEffect(() => { if (!dataLancamento) setDataLancamento(hoje); }, [hoje]);

  async function carregarFaturamento() {
    const supabase = createClient();
    const { data } = await supabase
      .from('faturamento_diario')
      .select('*')
      .order('data', { ascending: true });
    setFaturamentoData(data || []);
    setCarregando(false);
  }

  useEffect(() => { carregarFaturamento(); }, []);

  const totalNum  = parseFloat(valorLancamento) || 0;
  const somaFormas = formasAtivas.reduce((sum, f) => sum + (parseFloat(valoresForma[f.id] || '0') || 0), 0);
  const diferenca  = totalNum - somaFormas;
  const somaBate   = totalNum > 0 && Math.abs(diferenca) < 0.01;

  const periodoLabel = mesInicio === mesFim
    ? `${MESES[mesInicio]} ${ano}`
    : `${MESES[mesInicio]}–${MESES[mesFim]} ${ano}`;

  const inRange = (dataStr: string) => {
    const [y, m] = (dataStr as string).split('-').map(Number);
    return y === ano && (m - 1) >= mesInicio && (m - 1) <= mesFim;
  };

  const dadosFiltrados = (filtroUnidade === 'todas'
    ? faturamentoData
    : faturamentoData.filter(d => d.unidade_id === filtroUnidade)
  ).filter(d => inRange(d.data));

  const totalMes  = dadosFiltrados.filter(d => d.valor > 0).reduce((a: number, b: any) => a + Number(b.valor), 0);
  const hojeData  = faturamentoData.filter(d => d.data === hoje && (filtroUnidade === 'todas' || d.unidade_id === filtroUnidade));
  const totalHoje = hojeData.reduce((a: number, b: any) => a + Number(b.valor), 0);

  const totalGeral = faturamentoData.filter(d => inRange(d.data)).reduce((a: number, b: any) => a + Number(b.valor), 0);

  const diasComMov = dadosFiltrados.filter(d => d.valor > 0);
  const mediaFaturamento = diasComMov.length > 0 ? totalMes / diasComMov.length : 0;

  const mediaPorUnidade = useMemo(() =>
    unidades.map((u, i) => {
      const dias = faturamentoData.filter(d => {
        const [y, m] = (d.data as string).split('-').map(Number);
        return d.unidade_id === u.id && d.valor > 0 && y === ano && (m - 1) >= mesInicio && (m - 1) <= mesFim;
      });
      const soma = dias.reduce((a, b) => a + Number(b.valor), 0);
      return { id: u.id, nome: u.nome, cor: CORES_UNIDADE[i % CORES_UNIDADE.length], media: dias.length > 0 ? soma / dias.length : 0, diasCount: dias.length };
    }),
  [unidades, faturamentoData, ano, mesInicio, mesFim]);

  const diasUnicos = Array.from(new Set(faturamentoData.map(d => d.data))).sort() as string[];

  function valorDia(data: string, uid: string) {
    return Number(faturamentoData.find(d => d.data === data && d.unidade_id === uid)?.valor ?? 0);
  }

  async function handleSalvar() {
    if (totalNum <= 0) { setErroSalvar('Informe o valor do faturamento.'); return; }
    if (totalNum > 0 && !somaBate && somaFormas > 0) { setErroSalvar('Distribua corretamente o valor por forma de pagamento.'); return; }
    setSalvando(true); setErroSalvar(''); setSucesso('');
    const supabase = createClient();

    // Montar payload de meios por dia
    const meiosPayload: Record<string, number> = {};
    if (somaBate && formasAtivas.length > 0) {
      for (const f of formasAtivas) {
        const val = parseFloat(valoresForma[f.id] || '0') || 0;
        if (val > 0) meiosPayload[f.id] = val;
      }
    }

    const dataSalvar = dataLancamento || hoje;

    // Salvar faturamento diário com meios embutidos
    const { error } = await supabase.from('faturamento_diario').upsert({
      id: `fat-${unidadeLancamento}-${dataSalvar}`,
      unidade_id: unidadeLancamento,
      data: dataSalvar,
      valor: totalNum,
      meios: meiosPayload,
    }, { onConflict: 'unidade_id,data' });
    if (error) { setErroSalvar('Erro ao salvar: ' + error.message); setSalvando(false); return; }

    // Recalcular totais mensais de meios_pagamento somando todos os dias do mês
    if (Object.keys(meiosPayload).length > 0) {
      const dataObj = new Date(dataSalvar + 'T12:00:00');
      const ano = dataObj.getFullYear();
      const mes = dataObj.getMonth(); // 0=Jan
      const mesStr = String(mes + 1).padStart(2, '0');
      const mesProxStr = String(mes + 2).padStart(2, '0');
      const { data: diasMes } = await supabase
        .from('faturamento_diario')
        .select('meios')
        .eq('unidade_id', unidadeLancamento)
        .gte('data', `${ano}-${mesStr}-01`)
        .lt('data', mes < 11 ? `${ano}-${mesProxStr}-01` : `${ano + 1}-01-01`);

      // Somar formas de todos os dias do mês
      const totaisMes: Record<string, number> = {};
      for (const row of diasMes || []) {
        const m = (row.meios || {}) as Record<string, number>;
        for (const [formaId, val] of Object.entries(m)) {
          totaisMes[formaId] = (totaisMes[formaId] || 0) + Number(val);
        }
      }

      // Upsert totais mensais corrigidos
      for (const f of formasAtivas) {
        const totalMensal = totaisMes[f.id] || 0;
        if (totalMensal > 0) {
          await supabase.from('meios_pagamento').upsert({
            unidade_id: unidadeLancamento,
            ano,
            mes,
            forma: f.nome,
            valor: totalMensal,
            cor: f.cor,
          }, { onConflict: 'unidade_id,ano,mes,forma' });
        }
      }
    }

    await carregarFaturamento();
    setSalvando(false);
    setSucesso('Faturamento salvo com sucesso!');
    setValorLancamento('');
    setValoresForma({});
    setDataLancamento(hoje);
    setTimeout(() => setSucesso(''), 4000);
  }

  function handleOpenEditFat(record: any) {
    setEditandoFat(record);
    setEditFatValor(String(record.valor || ''));
    const meiosExist = (record.meios || {}) as Record<string, number>;
    const meiosStr: Record<string, string> = {};
    for (const [k, v] of Object.entries(meiosExist)) meiosStr[k] = String(v);
    setEditFatMeios(meiosStr);
  }

  async function handleSalvarEditFat() {
    if (!editandoFat) return;
    const totalEdit = parseFloat(editFatValor) || 0;
    if (totalEdit <= 0) return;
    setSalvandoEditFat(true);
    const supabase = createClient();

    const meiosPayload: Record<string, number> = {};
    for (const f of formasAtivas) {
      const val = parseFloat(editFatMeios[f.id] || '0') || 0;
      if (val > 0) meiosPayload[f.id] = val;
    }

    const dataSalvar = editandoFat.data;
    const unidSalvar = editandoFat.unidade_id;

    await supabase.from('faturamento_diario').upsert({
      id: `fat-${unidSalvar}-${dataSalvar}`,
      unidade_id: unidSalvar,
      data: dataSalvar,
      valor: totalEdit,
      meios: meiosPayload,
    }, { onConflict: 'unidade_id,data' });

    if (Object.keys(meiosPayload).length > 0) {
      const dataObj = new Date(dataSalvar + 'T12:00:00');
      const ano = dataObj.getFullYear();
      const mes = dataObj.getMonth();
      const mesStr = String(mes + 1).padStart(2, '0');
      const mesProxStr = String(mes + 2).padStart(2, '0');
      const { data: diasMes } = await supabase
        .from('faturamento_diario')
        .select('meios')
        .eq('unidade_id', unidSalvar)
        .gte('data', `${ano}-${mesStr}-01`)
        .lt('data', mes < 11 ? `${ano}-${mesProxStr}-01` : `${ano + 1}-01-01`);
      const totaisMes: Record<string, number> = {};
      for (const row of diasMes || []) {
        const m = (row.meios || {}) as Record<string, number>;
        for (const [formaId, val] of Object.entries(m)) {
          totaisMes[formaId] = (totaisMes[formaId] || 0) + Number(val);
        }
      }
      for (const f of formasAtivas) {
        const totalMensal = totaisMes[f.id] || 0;
        if (totalMensal > 0) {
          await supabase.from('meios_pagamento').upsert({
            unidade_id: unidSalvar, ano, mes, forma: f.nome, valor: totalMensal, cor: f.cor,
          }, { onConflict: 'unidade_id,ano,mes,forma' });
        }
      }
    }

    await carregarFaturamento();
    setSalvandoEditFat(false);
    setEditandoFat(null);
  }

  return (
    <>
      <Header title="Faturamento / Demanda" />
      <main className="flex-1 overflow-y-auto p-6 space-y-5">

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Hoje — {formatDia(hoje)}</p>
            <p className="text-[1.625rem] leading-none font-display italic text-gray-900">{formatCurrency(totalHoje)}</p>
            <p className="text-xs text-gray-400 mt-1">{hojeData.filter(d => d.valor > 0).length > 0 ? 'Lançado' : 'Ainda não lançado'}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Acumulado — {periodoLabel}</p>
            <p className="text-[1.625rem] leading-none font-display italic text-gray-900">{formatCurrency(totalMes)}</p>
            <p className="text-xs text-gray-400 mt-1">{diasComMov.length} dia{diasComMov.length !== 1 ? 's' : ''} lançados</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Total Geral — {periodoLabel}</p>
            <p className="text-[1.625rem] leading-none font-display italic text-amber-600">{formatCurrency(totalGeral)}</p>
            <p className="text-xs text-gray-400 mt-1">Todas as unidades</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Média de Faturamento / Dia</p>
            {filtroUnidade === 'todas' ? (
              <div className="space-y-2 mt-1">
                {mediaPorUnidade.map(u => (
                  <div key={u.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: u.cor }} />
                      <span className="text-[11px] text-gray-500 font-medium">{u.nome}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 tabular-nums">{formatCurrency(u.media)}</span>
                  </div>
                ))}
                <div className="pt-1 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">por dia c/ movimento</span>
                  <span className="text-[11px] text-gray-400">{mediaPorUnidade.map(u => `${u.diasCount}d`).join(' / ')}</span>
                </div>
              </div>
            ) : (
              <>
                <p className="text-[1.625rem] leading-none font-display italic text-gray-900">{formatCurrency(mediaFaturamento)}</p>
                <p className="text-xs text-gray-400 mt-1">{diasComMov.length} dia{diasComMov.length !== 1 ? 's' : ''} com movimento</p>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {([
            { key: 'lancamento', label: 'Lançamento do Dia' },
            { key: 'historico',  label: 'Histórico' },
            { key: 'sazonalidade', label: 'Sazonalidade' },
          ] as { key: Aba; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setAba(t.key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${aba === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {aba === 'lancamento' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                Lançar Faturamento — {dataLancamento ? formatDia(dataLancamento) : formatDia(hoje)}/{(dataLancamento || hoje).split('-')[0]}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Data do Lançamento</label>
                  <input
                    type="date"
                    value={dataLancamento || hoje}
                    max={hoje}
                    onChange={e => setDataLancamento(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {dataLancamento && dataLancamento !== hoje && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      ⚠ Lançamento retroativo — será salvo na data selecionada
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Unidade</label>
                  <div className="grid grid-cols-2 gap-3">
                    {unidades.map(u => (
                      <button key={u.id} onClick={() => setUnidadeLancamento(u.id)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${unidadeLancamento === u.id ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                        <Building2 size={15} />{u.nome}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Faturamento Total do Dia (R$)</label>
                  <input type="number" value={valorLancamento} onChange={e => setValorLancamento(e.target.value)}
                    placeholder="0,00" min={0} step="0.01"
                    className="w-full px-4 py-3 text-xl font-bold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 tabular-nums" />
                  <p className="text-xs text-gray-400 mt-1.5">Valor total da caixa do dia — não discriminado por produto.</p>
                </div>

                {totalNum > 0 && (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                      <CreditCard size={14} className="text-gray-400" />
                      <span className="text-xs font-semibold text-gray-700">Distribuição por Forma de Pagamento</span>
                    </div>
                    <div className="p-4 space-y-3">
                      {formasAtivas.map(f => (
                        <div key={f.id} className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: f.cor }} />
                          <label className="text-xs font-medium text-gray-700 w-28 flex-shrink-0">{f.nome}</label>
                          <div className="flex-1 relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">R$</span>
                            <input type="number" min={0} step="0.01" value={valoresForma[f.id] ?? ''}
                              onChange={e => setValoresForma(prev => ({ ...prev, [f.id]: e.target.value }))}
                              placeholder="0,00"
                              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 tabular-nums" />
                          </div>
                        </div>
                      ))}
                      <div className={`flex items-center justify-between mt-2 pt-3 border-t rounded-lg px-3 py-2 ${somaBate ? 'bg-emerald-50 border-emerald-200' : somaFormas > totalNum ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                        <div className="flex items-center gap-1.5">
                          {somaBate ? <CheckCircle2 size={14} className="text-emerald-600" /> : <AlertCircle size={14} className={somaFormas > totalNum ? 'text-red-500' : 'text-amber-500'} />}
                          <span className={`text-xs font-medium ${somaBate ? 'text-emerald-700' : somaFormas > totalNum ? 'text-red-700' : 'text-amber-700'}`}>
                            {somaBate ? 'Total fechado!' : somaFormas > totalNum ? `Excede em R$ ${(somaFormas - totalNum).toFixed(2).replace('.', ',')}` : `Falta distribuir R$ ${diferenca.toFixed(2).replace('.', ',')}`}
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
                  <p className="text-xs text-amber-700">Após salvar, o histórico fica disponível somente para usuários com permissão de <strong>Ver histórico de faturamento</strong>.</p>
                </div>

                {erroSalvar && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erroSalvar}</p>}
                {sucesso && (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <p className="text-sm text-emerald-700 font-medium">{sucesso}</p>
                  </div>
                )}

                <button onClick={handleSalvar} disabled={salvando || (totalNum > 0 && somaFormas > 0 && !somaBate)}
                  className={`w-full py-3 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                  style={{ backgroundColor: '#D97706' }}>
                  {salvando ? 'Salvando…' : totalNum > 0 && somaFormas > 0 && !somaBate ? 'Distribua o valor por forma de pagamento' : 'Salvar Faturamento'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Hoje nas Unidades — {formatDia(hoje)}</h2>
              {carregando ? (
                <p className="text-sm text-gray-400">Carregando…</p>
              ) : (
                <div className="space-y-4">
                  {unidades.map(u => {
                    const lancado = faturamentoData.find(d => d.data === hoje && d.unidade_id === u.id);
                    return (
                      <div key={u.id} className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Building2 size={14} className="text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">{u.nome}</span>
                          </div>
                          {lancado && Number(lancado.valor) > 0 ? (
                            <span className="text-xs bg-emerald-100 text-emerald-700 font-medium px-2 py-0.5 rounded-full">Lançado</span>
                          ) : (
                            <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">Pendente</span>
                          )}
                        </div>
                        <p className="text-[1.625rem] leading-none font-display italic text-gray-900">
                          {lancado && Number(lancado.valor) > 0 ? formatCurrency(Number(lancado.valor)) : '—'}
                        </p>
                      </div>
                    );
                  })}
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
                    <p className="text-xs text-gray-500 mb-1">Total do dia (consolidado)</p>
                    <p className="text-[1.625rem] leading-none font-display italic text-amber-800">{formatCurrency(totalHoje)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {aba === 'historico' && (
          <div className="space-y-6">
            {carregando ? (
              <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400 text-sm">Carregando…</div>
            ) : (
              unidades
                .filter(u => filtroUnidade === 'todas' || filtroUnidade === u.id)
                .map((u, uIdx) => {
                  const diasU = Array.from(new Set(
                    faturamentoData.filter(d => d.unidade_id === u.id && inRange(d.data)).map(d => d.data)
                  )).sort() as string[];
                  const totalU = faturamentoData.filter(d => d.unidade_id === u.id && inRange(d.data)).reduce((a, b) => a + Number(b.valor), 0);

                  return (
                    <div key={u.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                        <Building2 size={15} style={{ color: CORES_UNIDADE[uIdx % CORES_UNIDADE.length] }} />
                        <h2 className="text-sm font-semibold text-gray-900">{u.nome}</h2>
                        <span className="text-xs text-gray-400 ml-auto">{diasU.length} dia{diasU.length !== 1 ? 's' : ''} lançados</span>
                      </div>
                      {diasU.length === 0 ? (
                        <div className="py-10 text-center text-gray-400 text-sm">Nenhum lançamento para esta unidade.</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm" style={{ minWidth: `${320 + formasAtivas.length * 110}px` }}>
                            <thead>
                              <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Data</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Dia</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-amber-50">Faturamento</th>
                                {formasAtivas.map(f => (
                                  <th key={f.id} className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                                    <span className="inline-flex items-center justify-end gap-1">
                                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: f.cor }} />{f.nome}
                                    </span>
                                  </th>
                                ))}
                                <th className="px-3 py-3"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {diasU.map(data => {
                                const v = valorDia(data, u.id);
                                const ds = diasSemana[getDiaSemana(data)];
                                const isDom = getDiaSemana(data) === 0;
                                return (
                                  <tr key={data} className={`hover:bg-gray-50 transition-colors ${isDom ? 'opacity-50' : ''}`}>
                                    <td className="px-4 py-2.5 text-gray-700 font-medium">{formatDia(data)}</td>
                                    <td className="px-4 py-2.5">
                                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${isDom ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>{ds}</span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-gray-900 bg-amber-50">
                                      {v > 0 ? formatCurrency(v) : <span className="text-gray-300">—</span>}
                                    </td>
                                    {formasAtivas.map((f, idx) => {
                                      const record = faturamentoData.find(d => d.data === data && d.unidade_id === u.id);
                                      const meios = (record?.meios || {}) as Record<string, number>;
                                      const temMeiosReais = Object.keys(meios).length > 0;
                                      // Usar dados reais se disponíveis, senão estimativa
                                      const vf = temMeiosReais
                                        ? (Number(meios[f.id]) || 0)
                                        : calcFormaHistorico(v, f.id, idx, formasAtivas);
                                      return (
                                        <td key={f.id} className="px-3 py-2.5 text-right tabular-nums text-gray-600 text-xs whitespace-nowrap">
                                          {v > 0 ? (
                                            <span style={{ color: vf > 0 ? f.cor : undefined }} className={vf > 0 ? 'font-medium' : 'text-gray-300'}>
                                              {vf > 0 ? formatCurrency(vf) : '—'}
                                            </span>
                                          ) : <span className="text-gray-300">—</span>}
                                        </td>
                                      );
                                    })}
                                    <td className="px-3 py-2.5">
                                      {(() => {
                                        const record = faturamentoData.find(d => d.data === data && d.unidade_id === u.id);
                                        return record ? (
                                          <button onClick={() => handleOpenEditFat(record)}
                                            className="p-1.5 text-gray-300 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Editar">
                                            <Pencil size={13} />
                                          </button>
                                        ) : null;
                                      })()}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="border-t-2 border-gray-200 bg-amber-50">
                                <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-900">Total do período</td>
                                <td className="px-4 py-3 text-right tabular-nums text-sm font-bold text-amber-800">{formatCurrency(totalU)}</td>
                                {formasAtivas.map((f, idx) => {
                                  const totalForma = diasU.reduce((sum, data) => {
                                    const record = faturamentoData.find(d => d.data === data && d.unidade_id === u.id);
                                    const meios = (record?.meios || {}) as Record<string, number>;
                                    const temMeiosReais = Object.keys(meios).length > 0;
                                    const v = valorDia(data, u.id);
                                    const vf = temMeiosReais
                                      ? (Number(meios[f.id]) || 0)
                                      : calcFormaHistorico(v, f.id, idx, formasAtivas);
                                    return sum + vf;
                                  }, 0);
                                  return (
                                    <td key={f.id} className="px-3 py-3 text-right tabular-nums text-sm font-bold text-amber-800 whitespace-nowrap">
                                      {formatCurrency(totalForma)}
                                    </td>
                                  );
                                })}
                                <td />
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        )}

        {aba === 'sazonalidade' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {unidades.map(u => (
              <div key={u.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 size={15} className="text-amber-600" />
                  <h2 className="text-sm font-semibold text-gray-900">{u.nome} — Média por Dia da Semana</h2>
                </div>
                {carregando ? (
                  <p className="text-sm text-gray-400">Carregando…</p>
                ) : (
                  <MediaDiaSemana dados={faturamentoData.filter(d => d.unidade_id === u.id).map(d => ({ data: d.data, valor: Number(d.valor) }))} />
                )}
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

      {/* Modal de edição de lançamento do histórico */}
      <Modal open={editandoFat !== null} onClose={() => setEditandoFat(null)}
        title={editandoFat ? `Editar — ${formatDia(editandoFat.data)} (${unidades.find(u => u.id === editandoFat.unidade_id)?.nome ?? editandoFat.unidade_id})` : ''}
        size="md">
        {editandoFat && (() => {
          const totalEdit = parseFloat(editFatValor) || 0;
          const somaEdit = formasAtivas.reduce((s, f) => s + (parseFloat(editFatMeios[f.id] || '0') || 0), 0);
          const difEdit = totalEdit - somaEdit;
          const bateEdit = totalEdit > 0 && Math.abs(difEdit) < 0.01;
          return (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Faturamento Total do Dia (R$)</label>
                <input autoFocus type="number" min={0} step="0.01" value={editFatValor}
                  onChange={e => setEditFatValor(e.target.value)}
                  className="w-full px-4 py-3 text-xl font-bold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 tabular-nums" />
              </div>

              {totalEdit > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                    <CreditCard size={14} className="text-gray-400" />
                    <span className="text-xs font-semibold text-gray-700">Distribuição por Forma de Pagamento</span>
                  </div>
                  <div className="p-4 space-y-3">
                    {formasAtivas.map(f => (
                      <div key={f.id} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: f.cor }} />
                        <label className="text-xs font-medium text-gray-700 w-28 flex-shrink-0">{f.nome}</label>
                        <div className="flex-1 relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">R$</span>
                          <input type="number" min={0} step="0.01" value={editFatMeios[f.id] ?? ''}
                            onChange={e => setEditFatMeios(prev => ({ ...prev, [f.id]: e.target.value }))}
                            placeholder="0,00"
                            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 tabular-nums" />
                        </div>
                      </div>
                    ))}
                    <div className={`flex items-center justify-between mt-2 pt-3 border-t rounded-lg px-3 py-2 ${bateEdit ? 'bg-emerald-50 border-emerald-200' : somaEdit > totalEdit ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                      <span className={`text-xs font-medium ${bateEdit ? 'text-emerald-700' : somaEdit > totalEdit ? 'text-red-700' : 'text-amber-700'}`}>
                        {bateEdit ? 'Total fechado!' : somaEdit > totalEdit ? `Excede em R$ ${(somaEdit - totalEdit).toFixed(2).replace('.', ',')}` : `Falta distribuir R$ ${difEdit.toFixed(2).replace('.', ',')}`}
                      </span>
                      <span className="text-xs tabular-nums text-gray-500">
                        {somaEdit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / {totalEdit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button onClick={() => setEditandoFat(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button onClick={handleSalvarEditFat} disabled={salvandoEditFat || totalEdit <= 0 || (somaEdit > 0 && !bateEdit)}
                  className="px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60" style={{ backgroundColor: '#D97706' }}>
                  {salvandoEditFat ? 'Salvando…' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </>
  );
}
