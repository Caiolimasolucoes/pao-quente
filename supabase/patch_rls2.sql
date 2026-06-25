-- Patch 2: políticas de escrita para tabelas de cadastro
-- Execute no Supabase → SQL Editor → New Query

-- Produtos
DROP POLICY IF EXISTS "autenticados escrevem produtos" ON produtos;
CREATE POLICY "autenticados escrevem produtos" ON produtos FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "autenticados atualizam produtos" ON produtos;
CREATE POLICY "autenticados atualizam produtos" ON produtos FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "autenticados deletam produtos" ON produtos;
CREATE POLICY "autenticados deletam produtos" ON produtos FOR DELETE TO authenticated USING (true);

-- Fornecedores
DROP POLICY IF EXISTS "autenticados escrevem fornecedores" ON fornecedores;
CREATE POLICY "autenticados escrevem fornecedores" ON fornecedores FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "autenticados atualizam fornecedores" ON fornecedores;
CREATE POLICY "autenticados atualizam fornecedores" ON fornecedores FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "autenticados deletam fornecedores" ON fornecedores;
CREATE POLICY "autenticados deletam fornecedores" ON fornecedores FOR DELETE TO authenticated USING (true);

-- Categorias de compra
DROP POLICY IF EXISTS "autenticados escrevem categorias_compra" ON categorias_compra;
CREATE POLICY "autenticados escrevem categorias_compra" ON categorias_compra FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "autenticados atualizam categorias_compra" ON categorias_compra;
CREATE POLICY "autenticados atualizam categorias_compra" ON categorias_compra FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "autenticados deletam categorias_compra" ON categorias_compra;
CREATE POLICY "autenticados deletam categorias_compra" ON categorias_compra FOR DELETE TO authenticated USING (true);

-- Categorias de boleto
DROP POLICY IF EXISTS "autenticados escrevem categorias_boleto" ON categorias_boleto;
CREATE POLICY "autenticados escrevem categorias_boleto" ON categorias_boleto FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "autenticados atualizam categorias_boleto" ON categorias_boleto;
CREATE POLICY "autenticados atualizam categorias_boleto" ON categorias_boleto FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "autenticados deletam categorias_boleto" ON categorias_boleto;
CREATE POLICY "autenticados deletam categorias_boleto" ON categorias_boleto FOR DELETE TO authenticated USING (true);

-- Unidades de medida
DROP POLICY IF EXISTS "autenticados escrevem unidades_medida" ON unidades_medida;
CREATE POLICY "autenticados escrevem unidades_medida" ON unidades_medida FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "autenticados atualizam unidades_medida" ON unidades_medida;
CREATE POLICY "autenticados atualizam unidades_medida" ON unidades_medida FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "autenticados deletam unidades_medida" ON unidades_medida;
CREATE POLICY "autenticados deletam unidades_medida" ON unidades_medida FOR DELETE TO authenticated USING (true);

-- Unidades da padaria (apenas UPDATE, não INSERT/DELETE para segurança)
DROP POLICY IF EXISTS "autenticados atualizam unidades" ON unidades;
CREATE POLICY "autenticados atualizam unidades" ON unidades FOR UPDATE TO authenticated USING (true);

-- Metas
DROP POLICY IF EXISTS "autenticados escrevem metas" ON metas;
CREATE POLICY "autenticados escrevem metas" ON metas FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "autenticados atualizam metas" ON metas;
CREATE POLICY "autenticados atualizam metas" ON metas FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "autenticados deletam metas" ON metas;
CREATE POLICY "autenticados deletam metas" ON metas FOR DELETE TO authenticated USING (true);

-- Compras (UPDATE + DELETE, INSERT já existia)
DROP POLICY IF EXISTS "autenticados atualizam compras" ON compras;
CREATE POLICY "autenticados atualizam compras" ON compras FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "autenticados deletam compras" ON compras;
CREATE POLICY "autenticados deletam compras" ON compras FOR DELETE TO authenticated USING (true);
