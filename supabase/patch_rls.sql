-- Patch: adiciona políticas de escrita para faturamento e meios de pagamento
-- Execute no Supabase → SQL Editor → New Query

-- Faturamento diário — INSERT e UPDATE (upsert)
CREATE POLICY IF NOT EXISTS "autenticados escrevem faturamento"
  ON faturamento_diario FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "autenticados atualizam faturamento"
  ON faturamento_diario FOR UPDATE TO authenticated USING (true);

-- Meios de pagamento — INSERT e UPDATE (upsert)
CREATE POLICY IF NOT EXISTS "autenticados escrevem meios pagamento"
  ON meios_pagamento FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "autenticados atualizam meios pagamento"
  ON meios_pagamento FOR UPDATE TO authenticated USING (true);
