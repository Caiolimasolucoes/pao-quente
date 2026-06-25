'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export type FiltroUnidade = string;

export interface Unidade {
  id: string;
  nome: string;
  cnpj?: string;
  endereco?: string;
  responsavel?: string;
}

interface UnitContextValue {
  filtroUnidade: FiltroUnidade;
  setFiltroUnidade: (v: FiltroUnidade) => void;
  unidades: Unidade[];
  recarregarUnidades: () => Promise<void>;
}

const UnitContext = createContext<UnitContextValue>({
  filtroUnidade: 'todas',
  setFiltroUnidade: () => {},
  unidades: [],
  recarregarUnidades: async () => {},
});

export function UnitProvider({ children }: { children: React.ReactNode }) {
  const [filtroUnidade, setFiltroUnidade] = useState<FiltroUnidade>('todas');
  const [unidades, setUnidades] = useState<Unidade[]>([]);

  async function recarregarUnidades() {
    const supabase = createClient();
    const { data } = await supabase
      .from('unidades')
      .select('id, nome, cnpj, endereco, responsavel')
      .order('id');
    if (data) setUnidades(data);
  }

  useEffect(() => { recarregarUnidades(); }, []);

  return (
    <UnitContext.Provider value={{ filtroUnidade, setFiltroUnidade, unidades, recarregarUnidades }}>
      {children}
    </UnitContext.Provider>
  );
}

export function useUnit() {
  return useContext(UnitContext);
}
