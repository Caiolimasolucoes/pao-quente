'use client';

import { createContext, useContext, useState, useEffect } from 'react';

export interface MetaFaturamento {
  id: string;
  tipo: 'diario' | 'semanal' | 'mensal' | 'anual';
  valor: number;
  ano: number;
  unidadeId: string;
}

export interface MetaDespesaCategoria {
  categoriaKey: string;
  categoriaNome: string;
  percentualMax: number;
  ano: number;
  unidadeId: string;
}

export interface MetaLucro {
  id: string;
  tipo: 'mensal' | 'anual';
  valor: number;
  ano: number;
  unidadeId: string;
}

const DEFAULT_FAT: MetaFaturamento[] = [
  { id: 'f1', tipo: 'diario',  valor: 1800,   ano: 2026, unidadeId: 'todas' },
  { id: 'f2', tipo: 'semanal', valor: 11000,  ano: 2026, unidadeId: 'todas' },
  { id: 'f3', tipo: 'mensal',  valor: 34000,  ano: 2026, unidadeId: 'todas' },
  { id: 'f4', tipo: 'anual',   valor: 400000, ano: 2026, unidadeId: 'todas' },
];

export const DEFAULT_DESP: MetaDespesaCategoria[] = [
  { categoriaKey: 'compraInsumos',  categoriaNome: 'Compra de Insumos',  percentualMax: 40, ano: 2026, unidadeId: 'todas' },
  { categoriaKey: 'folhaPagamento', categoriaNome: 'Folha de Pagamento', percentualMax: 22, ano: 2026, unidadeId: 'todas' },
  { categoriaKey: 'impostos',       categoriaNome: 'Impostos',           percentualMax: 7,  ano: 2026, unidadeId: 'todas' },
  { categoriaKey: 'despesasAdm',    categoriaNome: 'Despesas ADM',       percentualMax: 15, ano: 2026, unidadeId: 'todas' },
  { categoriaKey: 'manutencao',     categoriaNome: 'Manutenção',         percentualMax: 3,  ano: 2026, unidadeId: 'todas' },
  { categoriaKey: 'investimento',   categoriaNome: 'Investimento',       percentualMax: 2,  ano: 2026, unidadeId: 'todas' },
  { categoriaKey: 'proLabore',      categoriaNome: 'Pró Labore',         percentualMax: 10, ano: 2026, unidadeId: 'todas' },
  { categoriaKey: 'retiraSocio',    categoriaNome: 'Retira Sócio',       percentualMax: 5,  ano: 2026, unidadeId: 'todas' },
];

const DEFAULT_LUCRO: MetaLucro[] = [
  { id: 'l1', tipo: 'mensal', valor: 5000,  ano: 2026, unidadeId: 'todas' },
  { id: 'l2', tipo: 'anual',  valor: 60000, ano: 2026, unidadeId: 'todas' },
];

interface MetasCtx {
  metasFaturamento: MetaFaturamento[];
  metasDespesa: MetaDespesaCategoria[];
  metasLucro: MetaLucro[];
  salvarMetasFaturamento: (metas: MetaFaturamento[]) => void;
  salvarMetasDespesa: (metas: MetaDespesaCategoria[]) => void;
  salvarMetasLucro: (metas: MetaLucro[]) => void;
  getMetaFat: (tipo: MetaFaturamento['tipo'], ano: number, unidadeId: string) => number;
  getMetaLucro: (tipo: MetaLucro['tipo'], ano: number, unidadeId: string) => number;
  getMetaDesp: (categoriaKey: string, ano: number, unidadeId: string) => number | null;
}

const Ctx = createContext<MetasCtx>({} as MetasCtx);

function tryParse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

export function MetasProvider({ children }: { children: React.ReactNode }) {
  const [metasFaturamento, setMetasFaturamento] = useState<MetaFaturamento[]>(DEFAULT_FAT);
  const [metasDespesa, setMetasDespesa]         = useState<MetaDespesaCategoria[]>(DEFAULT_DESP);
  const [metasLucro, setMetasLucro]             = useState<MetaLucro[]>(DEFAULT_LUCRO);

  useEffect(() => {
    setMetasFaturamento(tryParse('pq_metas_fat', DEFAULT_FAT));
    setMetasDespesa(tryParse('pq_metas_desp', DEFAULT_DESP));
    setMetasLucro(tryParse('pq_metas_lucro', DEFAULT_LUCRO));
  }, []);

  function salvarMetasFaturamento(metas: MetaFaturamento[]) {
    setMetasFaturamento(metas);
    localStorage.setItem('pq_metas_fat', JSON.stringify(metas));
  }

  function salvarMetasDespesa(metas: MetaDespesaCategoria[]) {
    setMetasDespesa(metas);
    localStorage.setItem('pq_metas_desp', JSON.stringify(metas));
  }

  function salvarMetasLucro(metas: MetaLucro[]) {
    setMetasLucro(metas);
    localStorage.setItem('pq_metas_lucro', JSON.stringify(metas));
  }

  function getMetaFat(tipo: MetaFaturamento['tipo'], ano: number, unidadeId: string) {
    return metasFaturamento.find(
      (m) => m.tipo === tipo && m.ano === ano && (m.unidadeId === unidadeId || m.unidadeId === 'todas'),
    )?.valor ?? 0;
  }

  function getMetaLucro(tipo: MetaLucro['tipo'], ano: number, unidadeId: string) {
    return metasLucro.find(
      (m) => m.tipo === tipo && m.ano === ano && (m.unidadeId === unidadeId || m.unidadeId === 'todas'),
    )?.valor ?? 0;
  }

  function getMetaDesp(categoriaKey: string, ano: number, unidadeId: string) {
    const m = metasDespesa.find(
      (d) => d.categoriaKey === categoriaKey && d.ano === ano && (d.unidadeId === unidadeId || d.unidadeId === 'todas'),
    );
    return m ? m.percentualMax : null;
  }

  return (
    <Ctx.Provider value={{
      metasFaturamento, metasDespesa, metasLucro,
      salvarMetasFaturamento, salvarMetasDespesa, salvarMetasLucro,
      getMetaFat, getMetaLucro, getMetaDesp,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useMetas() { return useContext(Ctx); }
