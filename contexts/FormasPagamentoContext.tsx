'use client';

import { createContext, useContext, useState } from 'react';

export interface FormaPagamento {
  id: string;
  nome: string;
  cor: string;
  ativo: boolean;
}

const DEFAULT_FORMAS: FormaPagamento[] = [
  { id: 'pix',        nome: 'Pix',        cor: '#10B981', ativo: true },
  { id: 'debito',     nome: 'Débito',     cor: '#3B82F6', ativo: true },
  { id: 'visa',       nome: 'Visa',       cor: '#8B5CF6', ativo: true },
  { id: 'mastercard', nome: 'Mastercard', cor: '#F59E0B', ativo: true },
  { id: 'elo',        nome: 'Elo',        cor: '#EF4444', ativo: true },
  { id: 'dinheiro',   nome: 'Dinheiro',   cor: '#6B7280', ativo: true },
];

interface FormasPagamentoContextValue {
  formas: FormaPagamento[];
  toggleForma: (id: string) => void;
  adicionarForma: (nome: string, cor: string) => void;
  removerForma: (id: string) => void;
}

const FormasPagamentoContext = createContext<FormasPagamentoContextValue>({
  formas: DEFAULT_FORMAS,
  toggleForma: () => {},
  adicionarForma: () => {},
  removerForma: () => {},
});

export function FormasPagamentoProvider({ children }: { children: React.ReactNode }) {
  const [formas, setFormas] = useState<FormaPagamento[]>(DEFAULT_FORMAS);

  function toggleForma(id: string) {
    setFormas((prev) => prev.map((f) => f.id === id ? { ...f, ativo: !f.ativo } : f));
  }

  function adicionarForma(nome: string, cor: string) {
    const id = nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-');
    setFormas((prev) => [...prev, { id, nome, cor, ativo: true }]);
  }

  function removerForma(id: string) {
    setFormas((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <FormasPagamentoContext.Provider value={{ formas, toggleForma, adicionarForma, removerForma }}>
      {children}
    </FormasPagamentoContext.Provider>
  );
}

export function useFormasPagamento() {
  return useContext(FormasPagamentoContext);
}
