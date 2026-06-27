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
  verHistoricoFaturamento: boolean;
  verIndicadoresSensiveis: boolean;
  unidadeRestrita: string | null;
  simulandoComo: string | null;
  setPermissoes: (
    abas: string[],
    fin: boolean,
    compras: boolean,
    historico: boolean,
    indicadores: boolean,
    unidade: string | null,
    nome: string,
  ) => void;
  resetarAdmin: () => void;
}

const Ctx = createContext<PermissoesCtx>({
  abasVisiveis: TODAS_ABAS,
  resumoFinanceiro: true,
  resumoCompras: true,
  verHistoricoFaturamento: true,
  verIndicadoresSensiveis: true,
  unidadeRestrita: null,
  simulandoComo: null,
  setPermissoes: () => {},
  resetarAdmin: () => {},
});

export function PermissoesProvider({ children }: { children: React.ReactNode }) {
  const [abasVisiveis, setAbasVisiveis]               = useState<string[]>(TODAS_ABAS);
  const [resumoFinanceiro, setResFinanceiro]           = useState(true);
  const [resumoCompras, setResCompras]                 = useState(true);
  const [verHistoricoFaturamento, setVerHistorico]     = useState(true);
  const [verIndicadoresSensiveis, setVerIndicadores]   = useState(true);
  const [unidadeRestrita, setUnidadeRestrita]          = useState<string | null>(null);
  const [simulandoComo, setSimulandoComo]              = useState<string | null>(null);

  function setPermissoes(
    abas: string[],
    fin: boolean,
    compras: boolean,
    historico: boolean,
    indicadores: boolean,
    unidade: string | null,
    nome: string,
  ) {
    setAbasVisiveis(abas);
    setResFinanceiro(fin);
    setResCompras(compras);
    setVerHistorico(historico);
    setVerIndicadores(indicadores);
    setUnidadeRestrita(unidade);
    setSimulandoComo(nome);
  }

  function resetarAdmin() {
    setAbasVisiveis(TODAS_ABAS);
    setResFinanceiro(true);
    setResCompras(true);
    setVerHistorico(true);
    setVerIndicadores(true);
    setUnidadeRestrita(null);
    setSimulandoComo(null);
  }

  return (
    <Ctx.Provider value={{
      abasVisiveis, resumoFinanceiro, resumoCompras,
      verHistoricoFaturamento, verIndicadoresSensiveis,
      unidadeRestrita, simulandoComo,
      setPermissoes, resetarAdmin,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePermissoes() {
  return useContext(Ctx);
}
