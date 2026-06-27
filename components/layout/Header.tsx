'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Bell, Building2, CalendarDays, X, Menu, AlertTriangle, Clock } from 'lucide-react';
import { useUnit } from '@/contexts/UnitContext';
import { useDateRange } from '@/contexts/DateRangeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useNotificacoes } from '@/contexts/NotificacoesContext';
import { usePermissoes } from '@/contexts/PermissoesContext';
import { formatDate } from '@/lib/utils';

const MESES_CURTO = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MESES_LONGO = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const MOCK_ANO = 2026;
const MOCK_MES_MAX = 5;

interface HeaderProps { title: string; }

export default function Header({ title }: HeaderProps) {
  const { filtroUnidade, setFiltroUnidade, unidades } = useUnit();
  const { mesInicio, mesFim, ano, setRange } = useDateRange();
  const { toggle } = useSidebar();
  const { notificacoes, totalNaoLidas, marcarLida, marcarTodasLidas } = useNotificacoes();
  const { unidadeRestrita } = usePermissoes();

  // Quando há restrição de unidade, forçar o filtro globalmente
  useEffect(() => {
    if (unidadeRestrita) setFiltroUnidade(unidadeRestrita);
  }, [unidadeRestrita]);

  const [open, setOpen]           = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [anoLocal, setAnoLocal]   = useState(ano);
  const [fase, setFase]           = useState<'inicio' | 'fim'>('inicio');
  const [tempIni, setTempIni]     = useState<number | null>(null);
  const [hover, setHover]         = useState<number | null>(null);
  const popRef   = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setOpen(false);
        resetPicker();
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  useEffect(() => {
    if (!notifOpen) return;
    function handle(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [notifOpen]);

  function resetPicker() {
    setFase('inicio');
    setTempIni(null);
    setHover(null);
    setAnoLocal(ano);
  }

  function handleOpen() {
    setAnoLocal(ano);
    resetPicker();
    setOpen(true);
  }

  function handleMesClick(idx: number) {
    if (fase === 'inicio') {
      setTempIni(idx);
      setFase('fim');
    } else {
      setRange(tempIni!, idx, anoLocal);
      setOpen(false);
      resetPicker();
    }
  }

  function isDisabled(idx: number) {
    return anoLocal === MOCK_ANO && idx > MOCK_MES_MAX;
  }

  const effectiveIni = fase === 'fim' && tempIni !== null ? tempIni : mesInicio;
  const effectiveFim = fase === 'fim' && hover !== null && tempIni !== null
    ? (hover >= tempIni ? hover : tempIni)
    : mesFim;

  function isInRange(idx: number) {
    if (anoLocal !== ano) return false;
    const lo = Math.min(effectiveIni, effectiveFim);
    const hi = Math.max(effectiveIni, effectiveFim);
    return idx > lo && idx < hi;
  }
  function isStart(idx: number) {
    if (anoLocal !== ano) return false;
    return fase === 'fim' && tempIni !== null ? idx === tempIni : idx === mesInicio;
  }
  function isEnd(idx: number) {
    if (anoLocal !== ano) return false;
    return fase === 'fim' && hover !== null && tempIni !== null
      ? idx === (hover >= tempIni ? hover : tempIni)
      : idx === mesFim;
  }

  function label() {
    if (mesInicio === mesFim) return `${MESES_CURTO[mesInicio]}/${ano}`;
    return `${MESES_CURTO[mesInicio]}–${MESES_CURTO[mesFim]}/${ano}`;
  }

  const nMeses = mesFim - mesInicio + 1;

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-gray-200 flex items-center px-3 sm:px-6 flex-shrink-0 gap-2 sm:gap-4">
      {/* Hamburger — mobile only */}
      <button
        onClick={toggle}
        className="lg:hidden p-2 -ml-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </button>

      <h1 className="text-base sm:text-lg font-semibold text-gray-900 flex-1 truncate">{title}</h1>

      <div className="flex items-center gap-1.5 sm:gap-3 ml-auto">
        {/* Seletor de unidade */}
        <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2 sm:px-3 py-1.5">
          <Building2 size={14} className="text-gray-500 flex-shrink-0" />
          {unidadeRestrita ? (
            <span className="text-xs sm:text-sm font-medium text-gray-700">
              {unidades.find(u => u.id === unidadeRestrita)?.nome ?? 'Unidade restrita'}
            </span>
          ) : (
            <select
              value={filtroUnidade}
              onChange={(e) => setFiltroUnidade(e.target.value)}
              className="text-xs sm:text-sm font-medium text-gray-700 bg-transparent border-none outline-none cursor-pointer"
            >
              <option value="todas">Todas as unidades</option>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>{u.nome}</option>
              ))}
            </select>
          )}
        </div>

        {/* Date range picker */}
        <div className="relative" ref={popRef}>
          <button
            onClick={handleOpen}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 transition-colors rounded-lg px-2 sm:px-3 py-1.5"
          >
            <CalendarDays size={14} className="text-amber-600 flex-shrink-0" />
            <span className="hidden sm:inline text-sm font-medium text-gray-700 whitespace-nowrap">{label()}</span>
            {nMeses > 1 && (
              <span className="text-[10px] bg-amber-100 text-amber-700 font-semibold px-1.5 py-0.5 rounded-full">
                {nMeses}m
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-72">
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => setAnoLocal((a) => a - 1)} className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-900">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-bold text-gray-900">{anoLocal}</span>
                <button onClick={() => setAnoLocal((a) => a + 1)} className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-900">
                  <ChevronRight size={16} />
                </button>
              </div>
              <p className="text-[10px] text-center text-gray-400 mb-3">
                {fase === 'inicio' ? 'Clique no mês inicial' : 'Clique no mês final'}
              </p>
              <div className="grid grid-cols-4 gap-1">
                {MESES_CURTO.map((m, idx) => {
                  const disabled = isDisabled(idx);
                  const start    = isStart(idx);
                  const end      = isEnd(idx);
                  const inRange  = isInRange(idx);
                  const isHover  = fase === 'fim' && hover === idx && !disabled;
                  return (
                    <button
                      key={m}
                      disabled={disabled}
                      onClick={() => handleMesClick(idx)}
                      onMouseEnter={() => setHover(idx)}
                      onMouseLeave={() => setHover(null)}
                      className={[
                        'py-2 rounded-lg text-xs font-medium transition-colors',
                        disabled ? 'text-gray-300 cursor-not-allowed' :
                        start || end ? 'bg-amber-500 text-white' :
                        inRange ? 'bg-amber-100 text-amber-800' :
                        isHover ? 'bg-amber-50 text-amber-700' :
                        'text-gray-700 hover:bg-gray-100',
                      ].join(' ')}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 flex-wrap">
                {[
                  { l: 'Este mês', f: () => setRange(5, 5, 2026) },
                  { l: 'Trim.',    f: () => setRange(3, 5, 2026) },
                  { l: 'Semestre', f: () => setRange(0, 5, 2026) },
                ].map(({ l, f }) => (
                  <button key={l} onClick={() => { f(); setOpen(false); resetPicker(); }}
                    className="text-[10px] text-amber-700 font-semibold border border-amber-200 bg-amber-50 hover:bg-amber-100 rounded-md px-2 py-1 transition-colors">
                    {l}
                  </button>
                ))}
                <button onClick={() => { setOpen(false); resetPicker(); }}
                  className="ml-auto text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-0.5">
                  <X size={10} /> Fechar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notificações */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="Notificações"
          >
            <Bell size={18} />
            {totalNaoLidas > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold px-0.5">
                {totalNaoLidas > 9 ? '9+' : totalNaoLidas}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-xl shadow-xl border border-gray-200 w-80 max-h-[420px] flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-900">Notificações</span>
                <div className="flex items-center gap-2">
                  {totalNaoLidas > 0 && (
                    <button onClick={marcarTodasLidas} className="text-[10px] text-amber-700 font-medium hover:text-amber-900">
                      Marcar todas como lidas
                    </button>
                  )}
                  <button onClick={() => setNotifOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto flex-1">
                {notificacoes.length === 0 ? (
                  <div className="px-4 py-10 text-center text-gray-400 text-sm">
                    <Bell size={24} className="mx-auto mb-2 opacity-30" />
                    Nenhuma notificação pendente
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-50">
                    {notificacoes.map((n) => (
                      <li
                        key={n.id}
                        onClick={() => marcarLida(n.id)}
                        className={`px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-gray-50 transition-colors ${n.lida ? 'opacity-50' : ''}`}
                      >
                        <div className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${n.tipo === 'vencido' ? 'bg-red-100' : 'bg-amber-100'}`}>
                          {n.tipo === 'vencido'
                            ? <AlertTriangle size={14} className="text-red-600" />
                            : <Clock size={14} className="text-amber-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {!n.lida && <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />}
                            <p className="text-sm font-medium text-gray-900 truncate">{n.titulo}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{n.descricao}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Venc. {formatDate(n.vencimento)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {notificacoes.length > 0 && (
                <div className="px-4 py-2.5 border-t border-gray-100 text-[10px] text-gray-400 text-center">
                  {notificacoes.filter(n => n.tipo === 'vencido').length} vencido{notificacoes.filter(n => n.tipo === 'vencido').length !== 1 ? 's' : ''} · {notificacoes.filter(n => n.tipo === 'a_vencer').length} a vencer nos próximos 7 dias
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
