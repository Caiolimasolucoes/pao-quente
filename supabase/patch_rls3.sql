-- Patch 3: adiciona coluna meios (JSONB) em faturamento_diario
-- para armazenar distribuição por forma de pagamento por dia
-- Execute no Supabase → SQL Editor → New Query

ALTER TABLE faturamento_diario
  ADD COLUMN IF NOT EXISTS meios jsonb DEFAULT '{}'::jsonb;
