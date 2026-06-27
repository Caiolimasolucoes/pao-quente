'use client';

import { createContext, useContext, useState, useEffect } from 'react';

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

export const ABAS_POR_PERFIL: Record<string, string[]> = {
  'Administrador':      TODAS_ABAS,
  'Gestor Financeiro':  TODAS_ABAS.filter(a => a !== '/dashboard/usuarios'),
  'Operacional':        ['/dashboard', '/dashboard/faturamento', '/dashboard/compras', '/dashboard/cadastros'],
  'Visualizador':       TODAS_ABAS.filter(a => !['/dashboard/usuarios', '/dashboard/cadastros'].includes(a)),
};

export type UsuarioLogado = {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  ativo: boolean;
  unidade_restrita: string | null;
  ver_historico_faturamento: boolean;
  ver_indicadores_sensiveis: boolean;
};

interface PermissoesCtx {
  usuarioLogado: UsuarioLogado | null;
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
  usuarioLogado: null,
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

function aplicarPerfil(u: UsuarioLogado) {
  return {
    abas:       ABAS_POR_PERFIL[u.perfil] ?? TODAS_ABAS,
    resFin:     u.ver_indicadores_sensiveis,
    resComp:    true,
    historico:  u.ver_historico_faturamento,
    indicadores: u.ver_indicadores_sensiveis,
    unidade:    u.unidade_restrita ?? null,
  };
}

export function PermissoesProvider({ children }: { children: React.ReactNode }) {
  const [usuarioLogado, setUsuarioLogado]             = useState<UsuarioLogado | null>(null);
  const [abasVisiveis, setAbasVisiveis]               = useState<string[]>(TODAS_ABAS);
  const [resumoFinanceiro, setResFinanceiro]           = useState(true);
  const [resumoCompras, setResCompras]                 = useState(true);
  const [verHistoricoFaturamento, setVerHistorico]     = useState(true);
  const [verIndicadoresSensiveis, setVerIndicadores]   = useState(true);
  const [unidadeRestrita, setUnidadeRestrita]          = useState<string | null>(null);
  const [simulandoComo, setSimulandoComo]              = useState<string | null>(null);

  useEffect(() => {
    async function carregarSessao() {
      try {
        const res = await fetch('/api/usuarios/me');
        if (!res.ok) return;
        const perfil: UsuarioLogado | null = await res.json();
        if (!perfil) return;
        setUsuarioLogado(perfil);
        // Só aplica permissões do banco se não estiver em modo simulação
        setSimulandoComo(prev => {
          if (prev) return prev; // mantém simulação ativa
          const p = aplicarPerfil(perfil);
          setAbasVisiveis(p.abas);
          setResFinanceiro(p.resFin);
          setResCompras(p.resComp);
          setVerHistorico(p.historico);
          setVerIndicadores(p.indicadores);
          setUnidadeRestrita(p.unidade);
          return null;
        });
      } catch { /* sessão não disponível */ }
    }

    carregarSessao();

    // Re-carrega permissões quando o usuário volta para a aba
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') carregarSessao();
    }
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

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
    setSimulandoComo(null);
    if (usuarioLogado) {
      const p = aplicarPerfil(usuarioLogado);
      setAbasVisiveis(p.abas);
      setResFinanceiro(p.resFin);
      setResCompras(p.resComp);
      setVerHistorico(p.historico);
      setVerIndicadores(p.indicadores);
      setUnidadeRestrita(p.unidade);
    } else {
      setAbasVisiveis(TODAS_ABAS);
      setResFinanceiro(true);
      setResCompras(true);
      setVerHistorico(true);
      setVerIndicadores(true);
      setUnidadeRestrita(null);
    }
  }

  return (
    <Ctx.Provider value={{
      usuarioLogado,
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
