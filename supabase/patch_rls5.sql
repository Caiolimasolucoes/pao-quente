-- Patch 5: permite inserir novas unidades (cadastradas pelo usuário autenticado)
-- Execute no Supabase → SQL Editor → New Query

DROP POLICY IF EXISTS "autenticados inserem unidades" ON unidades;
CREATE POLICY "autenticados inserem unidades" ON unidades
  FOR INSERT TO authenticated WITH CHECK (true);
