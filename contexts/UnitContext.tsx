'use client';

import { createContext, useContext, useState } from 'react';

export type FiltroUnidade = 'todas' | '1' | '2';

interface UnitContextValue {
  filtroUnidade: FiltroUnidade;
  setFiltroUnidade: (v: FiltroUnidade) => void;
}

const UnitContext = createContext<UnitContextValue>({
  filtroUnidade: 'todas',
  setFiltroUnidade: () => {},
});

export function UnitProvider({ children }: { children: React.ReactNode }) {
  const [filtroUnidade, setFiltroUnidade] = useState<FiltroUnidade>('todas');
  return (
    <UnitContext.Provider value={{ filtroUnidade, setFiltroUnidade }}>
      {children}
    </UnitContext.Provider>
  );
}

export function useUnit() {
  return useContext(UnitContext);
}
