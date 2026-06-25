'use client';

import { createContext, useContext, useState } from 'react';

interface DateRangeCtx {
  mesInicio: number; // 0-indexed (0=Jan … 11=Dez)
  mesFim: number;
  ano: number;
  setRange: (ini: number, fim: number, ano: number) => void;
}

const Ctx = createContext<DateRangeCtx>({} as DateRangeCtx);

export function DateRangeProvider({ children }: { children: React.ReactNode }) {
  const [mesInicio, setMesInicio] = useState(0); // Janeiro
  const [mesFim, setMesFim]       = useState(5); // Junho (mês atual do mock)
  const [ano, setAno]             = useState(2026);

  function setRange(ini: number, fim: number, a: number) {
    const [start, end] = ini <= fim ? [ini, fim] : [fim, ini];
    setMesInicio(start);
    setMesFim(end);
    setAno(a);
  }

  return (
    <Ctx.Provider value={{ mesInicio, mesFim, ano, setRange }}>
      {children}
    </Ctx.Provider>
  );
}

export function useDateRange() { return useContext(Ctx); }
