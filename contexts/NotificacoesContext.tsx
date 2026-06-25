'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export type TipoNotificacao = 'vencido' | 'a_vencer';

export interface Notificacao {
  id: string;
  tipo: TipoNotificacao;
  titulo: string;
  descricao: string;
  vencimento: string;
  unidade_id: string;
  unidade_nome: string;
  lida: boolean;
}

interface NotificacoesContextValue {
  notificacoes: Notificacao[];
  totalNaoLidas: number;
  marcarLida: (id: string) => void;
  marcarTodasLidas: () => void;
  recarregar: () => Promise<void>;
}

const NotificacoesContext = createContext<NotificacoesContextValue>({
  notificacoes: [],
  totalNaoLidas: 0,
  marcarLida: () => {},
  marcarTodasLidas: () => {},
  recarregar: async () => {},
});

const DIAS_ANTECEDENCIA = 7;

function addDias(dateStr: string, dias: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + dias);
  return dt.toISOString().split('T')[0];
}

export function NotificacoesProvider({ children }: { children: React.ReactNode }) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);

  const recarregar = useCallback(async () => {
    const supabase = createClient();
    const hoje = new Date().toISOString().split('T')[0];
    const limite = addDias(hoje, DIAS_ANTECEDENCIA);

    const [{ data: boletos }, { data: unidades }] = await Promise.all([
      supabase
        .from('boletos')
        .select('id, fornecedor, valor, vencimento, status, unidade_id')
        .in('status', ['pendente', 'vencido'])
        .lte('vencimento', limite)
        .order('vencimento', { ascending: true }),
      supabase
        .from('unidades')
        .select('id, nome'),
    ]);

    const unidMap: Record<string, string> = {};
    for (const u of unidades || []) unidMap[u.id] = u.nome;

    const novas: Notificacao[] = (boletos || []).map((b) => {
      const vencido = b.vencimento < hoje || b.status === 'vencido';
      const tipo: TipoNotificacao = vencido ? 'vencido' : 'a_vencer';
      const unidNome = unidMap[b.unidade_id] || `Unidade ${b.unidade_id}`;

      const diasDiff = Math.round(
        (new Date(b.vencimento).getTime() - new Date(hoje).getTime()) / 86400000
      );

      let descricao = '';
      if (vencido) {
        const atraso = Math.abs(diasDiff);
        descricao = `Venceu há ${atraso} dia${atraso !== 1 ? 's' : ''} — ${unidNome}`;
      } else {
        descricao = diasDiff === 0
          ? `Vence hoje — ${unidNome}`
          : `Vence em ${diasDiff} dia${diasDiff !== 1 ? 's' : ''} — ${unidNome}`;
      }

      return {
        id: `notif-boleto-${b.id}`,
        tipo,
        titulo: b.fornecedor || 'Boleto',
        descricao,
        vencimento: b.vencimento,
        unidade_id: b.unidade_id,
        unidade_nome: unidNome,
        lida: false,
      };
    });

    setNotificacoes((prev) => {
      // Preserva estado "lida" de notificações que já existiam
      const lidasSet = new Set(prev.filter((n) => n.lida).map((n) => n.id));
      return novas.map((n) => ({ ...n, lida: lidasSet.has(n.id) }));
    });
  }, []);

  useEffect(() => { recarregar(); }, [recarregar]);

  function marcarLida(id: string) {
    setNotificacoes((prev) => prev.map((n) => n.id === id ? { ...n, lida: true } : n));
  }

  function marcarTodasLidas() {
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
  }

  const totalNaoLidas = notificacoes.filter((n) => !n.lida).length;

  return (
    <NotificacoesContext.Provider value={{ notificacoes, totalNaoLidas, marcarLida, marcarTodasLidas, recarregar }}>
      {children}
    </NotificacoesContext.Provider>
  );
}

export function useNotificacoes() {
  return useContext(NotificacoesContext);
}
