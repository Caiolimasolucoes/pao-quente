-- Patch 4: adiciona coluna valor_pago em boletos
-- Execute no Supabase → SQL Editor → New Query

ALTER TABLE boletos
  ADD COLUMN IF NOT EXISTS valor_pago numeric(10,2);
