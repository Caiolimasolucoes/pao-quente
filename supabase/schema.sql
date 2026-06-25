-- ============================================================
-- Pão Quente — Schema do Banco de Dados
-- Execute no Supabase: SQL Editor → New Query → colar e rodar
-- ============================================================

-- Unidades da padaria
CREATE TABLE IF NOT EXISTS unidades (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT,
  endereco TEXT,
  responsavel TEXT,
  ativo BOOLEAN DEFAULT true
);

-- DRE mensal por unidade (mes: 0=Jan … 11=Dez)
CREATE TABLE IF NOT EXISTS dre_mensal (
  id SERIAL PRIMARY KEY,
  unidade_id TEXT REFERENCES unidades(id),
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  faturamento_total NUMERIC(12,2) DEFAULT 0,
  faturamento_real NUMERIC(12,2) DEFAULT 0,
  faturamento_manha NUMERIC(12,2) DEFAULT 0,
  faturamento_tarde NUMERIC(12,2) DEFAULT 0,
  compra_insumos NUMERIC(12,2) DEFAULT 0,
  folha_pagamento NUMERIC(12,2) DEFAULT 0,
  impostos NUMERIC(12,2) DEFAULT 0,
  despesas_adm NUMERIC(12,2) DEFAULT 0,
  manutencao NUMERIC(12,2) DEFAULT 0,
  investimento NUMERIC(12,2) DEFAULT 0,
  pro_labore NUMERIC(12,2) DEFAULT 0,
  retira_socio NUMERIC(12,2) DEFAULT 0,
  despesas_total NUMERIC(12,2) DEFAULT 0,
  lucro NUMERIC(12,2) DEFAULT 0,
  UNIQUE(unidade_id, ano, mes)
);

-- Faturamento diário por unidade
CREATE TABLE IF NOT EXISTS faturamento_diario (
  id TEXT PRIMARY KEY,
  unidade_id TEXT REFERENCES unidades(id),
  data DATE NOT NULL,
  valor NUMERIC(12,2) DEFAULT 0,
  UNIQUE(unidade_id, data)
);

-- Meios de pagamento (snapshot mensal por unidade)
CREATE TABLE IF NOT EXISTS meios_pagamento (
  id SERIAL PRIMARY KEY,
  unidade_id TEXT REFERENCES unidades(id),
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  forma TEXT NOT NULL,
  valor NUMERIC(12,2) DEFAULT 0,
  cor TEXT,
  UNIQUE(unidade_id, ano, mes, forma)
);

-- Fornecedores
CREATE TABLE IF NOT EXISTS fornecedores (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT,
  ativo BOOLEAN DEFAULT true
);

-- Produtos
CREATE TABLE IF NOT EXISTS produtos (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  unidade TEXT,
  categoria TEXT,
  ativo BOOLEAN DEFAULT true
);

-- Unidades de medida
CREATE TABLE IF NOT EXISTS unidades_medida (
  id TEXT PRIMARY KEY,
  sigla TEXT NOT NULL,
  descricao TEXT
);

-- Categorias de compra
CREATE TABLE IF NOT EXISTS categorias_compra (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL
);

-- Categorias de boleto com subcategorias
CREATE TABLE IF NOT EXISTS categorias_boleto (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  subcategorias TEXT[] DEFAULT '{}'
);

-- Compras de insumos
CREATE TABLE IF NOT EXISTS compras (
  id TEXT PRIMARY KEY,
  unidade_id TEXT REFERENCES unidades(id),
  data DATE NOT NULL,
  produto TEXT NOT NULL,
  fornecedor TEXT NOT NULL,
  categoria TEXT,
  quantidade NUMERIC(10,3),
  unidade TEXT,
  valor_unitario NUMERIC(10,2),
  valor_total NUMERIC(12,2),
  observacao TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Boletos e pagamentos
CREATE TABLE IF NOT EXISTS boletos (
  id TEXT PRIMARY KEY,
  unidade_id TEXT REFERENCES unidades(id),
  fornecedor TEXT NOT NULL,
  categoria TEXT,
  sub_categoria TEXT,
  valor NUMERIC(12,2),
  vencimento DATE,
  data_pagamento DATE,
  status TEXT DEFAULT 'pendente',
  vinculado_compra BOOLEAN DEFAULT false,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Perfis de usuário (estende auth.users do Supabase)
CREATE TABLE IF NOT EXISTS perfis (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  perfil TEXT DEFAULT 'visualizador',
  unidade_restrita TEXT REFERENCES unidades(id),
  ver_historico_faturamento BOOLEAN DEFAULT false,
  ver_indicadores_sensiveis BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Metas financeiras
CREATE TABLE IF NOT EXISTS metas (
  id SERIAL PRIMARY KEY,
  unidade_id TEXT REFERENCES unidades(id),
  tipo TEXT NOT NULL,
  categoria_key TEXT,
  periodo TEXT NOT NULL,
  ano INTEGER NOT NULL,
  valor NUMERIC(12,2),
  percentual NUMERIC(5,2)
);

-- ── Row Level Security ──────────────────────────────────────────
-- Habilita RLS em todas as tabelas (segurança padrão)
ALTER TABLE unidades          ENABLE ROW LEVEL SECURITY;
ALTER TABLE dre_mensal        ENABLE ROW LEVEL SECURITY;
ALTER TABLE faturamento_diario ENABLE ROW LEVEL SECURITY;
ALTER TABLE meios_pagamento   ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores      ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE unidades_medida   ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_boleto ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras           ENABLE ROW LEVEL SECURITY;
ALTER TABLE boletos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis            ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas             ENABLE ROW LEVEL SECURITY;

-- Política: usuário autenticado lê tudo (simplificado para o protótipo)
CREATE POLICY "autenticados leem tudo" ON unidades          FOR SELECT TO authenticated USING (true);
CREATE POLICY "autenticados leem tudo" ON dre_mensal        FOR SELECT TO authenticated USING (true);
CREATE POLICY "autenticados leem tudo" ON faturamento_diario FOR SELECT TO authenticated USING (true);
CREATE POLICY "autenticados leem tudo" ON meios_pagamento   FOR SELECT TO authenticated USING (true);
CREATE POLICY "autenticados leem tudo" ON fornecedores      FOR SELECT TO authenticated USING (true);
CREATE POLICY "autenticados leem tudo" ON produtos          FOR SELECT TO authenticated USING (true);
CREATE POLICY "autenticados leem tudo" ON unidades_medida   FOR SELECT TO authenticated USING (true);
CREATE POLICY "autenticados leem tudo" ON categorias_compra FOR SELECT TO authenticated USING (true);
CREATE POLICY "autenticados leem tudo" ON categorias_boleto FOR SELECT TO authenticated USING (true);
CREATE POLICY "autenticados leem tudo" ON compras           FOR SELECT TO authenticated USING (true);
CREATE POLICY "autenticados leem tudo" ON boletos           FOR SELECT TO authenticated USING (true);
CREATE POLICY "autenticados leem tudo" ON metas             FOR SELECT TO authenticated USING (true);
CREATE POLICY "usuario le proprio perfil" ON perfis         FOR SELECT TO authenticated USING (auth.uid() = id);

-- Política: usuário autenticado pode inserir/atualizar compras e boletos
CREATE POLICY "autenticados escrevem compras" ON compras FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "autenticados escrevem boletos" ON boletos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "autenticados atualizam boletos" ON boletos FOR UPDATE TO authenticated USING (true);
