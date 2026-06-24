'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Bell, Building2 } from 'lucide-react';
import { useUnit } from '@/contexts/UnitContext';

const meses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const unidadeOpcoes = [
  { value: 'todas', label: 'Todas as unidades' },
  { value: '1',     label: 'Unidade Centro' },
  { value: '2',     label: 'Unidade Bairro' },
] as const;

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { filtroUnidade, setFiltroUnidade } = useUnit();
  const [mes, setMes] = useState(5);
  const [ano, setAno] = useState(2026);

  function prevMes() {
    if (mes === 0) { setMes(11); setAno((a) => a - 1); }
    else setMes((m) => m - 1);
  }

  function nextMes() {
    if (mes === 11) { setMes(0); setAno((a) => a + 1); }
    else setMes((m) => m + 1);
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 gap-4">
      <h1 className="text-lg font-semibold text-gray-900 flex-shrink-0">{title}</h1>

      <div className="flex items-center gap-3 ml-auto">
        {/* Seletor de unidade — global, afeta todas as abas */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5">
          <Building2 size={14} className="text-gray-500 flex-shrink-0" />
          <select
            value={filtroUnidade}
            onChange={(e) => setFiltroUnidade(e.target.value as typeof filtroUnidade)}
            className="text-sm font-medium text-gray-700 bg-transparent border-none outline-none cursor-pointer pr-1"
          >
            {unidadeOpcoes.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Seletor de período */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5">
          <button onClick={prevMes} className="text-gray-500 hover:text-gray-900 transition-colors" aria-label="Mês anterior">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[130px] text-center">
            {meses[mes]} / {ano}
          </span>
          <button onClick={nextMes} className="text-gray-500 hover:text-gray-900 transition-colors" aria-label="Próximo mês">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Notificações */}
        <button className="relative text-gray-400 hover:text-gray-600 transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
            2
          </span>
        </button>
      </div>
    </header>
  );
}
