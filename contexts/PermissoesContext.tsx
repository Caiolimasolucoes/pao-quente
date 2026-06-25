'use client';

import { createContext, useContext, useState } from 'react';

export const TODAS_ABAS = [
  '/dashboard',
  '/dashboard/faturamento',
  '/dashboard/indicadores',
  '/dashboard/compras',
  '/dashboard/boletos',
  '/dashboard/insights',
  '/dashboard/cadastros',
  '/dashboard/usuarios',
];

interface PermissoesCtx {
  abasVisiveis: string[];
  resumoFinanceiro: boolean;
  resumoCompras: boolean;
  simulandoComo: string | null;
  setPermissoes: (abas: string[], fin: boolean, compras: boolean, nome: string) => void;
  resetarAdmin: () => void;
}

const Ctx = createContext<PermissoesCtx>({
  abasVisiveis: TODAS_ABAS,
  resumoFinanceiro: true,
  resumoCompras: true,
  simulandoComo: null,
  setPermissoes: () => {},
  resetarAdmin: () => {},
});

export function PermissoesProvider({ children }: { children: React.ReactNode }) {
  const [abasVisiveis, setAbasVisiveis] = useState<string[]>(TODAS_ABAS);
  const [resumoFinanceiro, setResFinanceiro] = useState(true);
  const [resumoCompras, setResCompras] = useState(true);
  const [simulandoComo, setSimulandoComo] = useState<string | null>(null);

  function setPermissoes(abas: string[], fin: boolean, compras: boolean, nome: string) {
    setAbasVisiveis(abas);
    setResFinanceiro(fin);
    setResCompras(compras);
    setSimulandoComo(nome);
  }

  function resetarAdmin() {
    setAbasVisiveis(TODAS_ABAS);
    setResFinanceiro(true);
    setResCompras(true);
    setSimulandoComo(null);
  }

  return (
    <Ctx.Provider value={{ abasVisiveis, resumoFinanceiro, resumoCompras, simulandoComo, setPermissoes, resetarAdmin }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePermissoes() {
  return useContext(Ctx);
}
