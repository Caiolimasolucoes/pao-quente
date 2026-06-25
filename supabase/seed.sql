-- ============================================================
-- Pão Quente — Dados Iniciais
-- Execute APÓS o schema.sql no Supabase: SQL Editor
-- ============================================================

-- Unidades
INSERT INTO unidades (id, nome, cnpj, endereco, responsavel) VALUES
  ('1', 'Unidade Centro', '12.345.678/0001-01', 'Rua XV de Novembro, 480 — Centro', 'Maria Silva'),
  ('2', 'Unidade Bairro', '12.345.678/0002-82', 'Av. Getúlio Vargas, 1200 — Boa Vista', 'João Santos')
ON CONFLICT (id) DO NOTHING;

-- DRE Unidade 1 — Jan a Jun 2026 (mes: 0=Jan … 5=Jun)
INSERT INTO dre_mensal (unidade_id, ano, mes, faturamento_total, faturamento_real, compra_insumos, folha_pagamento, impostos, despesas_adm, manutencao, investimento, pro_labore, retira_socio, despesas_total, lucro) VALUES
  ('1', 2026, 0, 17200, 16400, 6600, 3800, 1030, 520, 150, 2000, 1800, 900, 16800, -400),
  ('1', 2026, 1, 18000, 17200, 7000, 3800, 1080, 560, 250,    0, 1800, 900, 15390, 1810),
  ('1', 2026, 2, 18800, 18000, 7200, 3950, 1130, 600, 300,    0, 1800, 900, 15880, 2120),
  ('1', 2026, 3, 18100, 17300, 7000, 3950, 1080, 550, 200,    0, 1800, 900, 15480, 1820),
  ('1', 2026, 4, 19400, 18500, 7400, 3950, 1160, 580, 280,    0, 1800, 900, 16070, 2430),
  ('1', 2026, 5, 19200, 18300, 7500, 3950, 1150, 600, 320,    0, 1800, 900, 16220, 2080)
ON CONFLICT (unidade_id, ano, mes) DO NOTHING;

-- DRE Unidade 2 — Jan a Jun 2026
INSERT INTO dre_mensal (unidade_id, ano, mes, faturamento_total, faturamento_real, compra_insumos, folha_pagamento, impostos, despesas_adm, manutencao, investimento, pro_labore, retira_socio, despesas_total, lucro) VALUES
  ('2', 2026, 0, 12000, 11500, 4800, 2400, 720, 330,  50, 0, 1200, 600, 10100, 1400),
  ('2', 2026, 1, 12400, 11900, 4900, 2400, 740, 360, 100, 0, 1200, 600, 10300, 1600),
  ('2', 2026, 2, 13100, 12500, 5200, 2550, 790, 380, 150, 0, 1200, 600, 10870, 1630),
  ('2', 2026, 3, 12800, 12300, 5100, 2550, 770, 350, 100, 0, 1200, 600, 10670, 1630),
  ('2', 2026, 4, 13600, 13000, 5300, 2550, 820, 370, 120, 0, 1200, 600, 10960, 2040),
  ('2', 2026, 5, 13500, 12800, 5300, 2550, 800, 380, 130, 0, 1200, 600, 10960, 1840)
ON CONFLICT (unidade_id, ano, mes) DO NOTHING;

-- Faturamento Diário — Junho 2026 (Unidade 1)
INSERT INTO faturamento_diario (id, unidade_id, data, valor) VALUES
  ('u1-1',  '1', '2026-06-01',  980), ('u1-2',  '1', '2026-06-02', 1050),
  ('u1-3',  '1', '2026-06-03',    0), ('u1-4',  '1', '2026-06-04', 1120),
  ('u1-5',  '1', '2026-06-05',  890), ('u1-6',  '1', '2026-06-06', 1230),
  ('u1-7',  '1', '2026-06-07', 1100), ('u1-8',  '1', '2026-06-08',  670),
  ('u1-9',  '1', '2026-06-09', 1050), ('u1-10', '1', '2026-06-10', 1080),
  ('u1-11', '1', '2026-06-11',    0), ('u1-12', '1', '2026-06-12',  960),
  ('u1-13', '1', '2026-06-13', 1020), ('u1-14', '1', '2026-06-14', 1150),
  ('u1-15', '1', '2026-06-15',  880), ('u1-16', '1', '2026-06-16', 1200),
  ('u1-17', '1', '2026-06-17', 1040), ('u1-18', '1', '2026-06-18', 1090)
ON CONFLICT (id) DO NOTHING;

-- Faturamento Diário — Junho 2026 (Unidade 2)
INSERT INTO faturamento_diario (id, unidade_id, data, valor) VALUES
  ('u2-1',  '2', '2026-06-01',  640), ('u2-2',  '2', '2026-06-02',  710),
  ('u2-3',  '2', '2026-06-03',    0), ('u2-4',  '2', '2026-06-04',  790),
  ('u2-5',  '2', '2026-06-05',  580), ('u2-6',  '2', '2026-06-06',  810),
  ('u2-7',  '2', '2026-06-07',  760), ('u2-8',  '2', '2026-06-08',  430),
  ('u2-9',  '2', '2026-06-09',  700), ('u2-10', '2', '2026-06-10',  730),
  ('u2-11', '2', '2026-06-11',    0), ('u2-12', '2', '2026-06-12',  650),
  ('u2-13', '2', '2026-06-13',  680), ('u2-14', '2', '2026-06-14',  790),
  ('u2-15', '2', '2026-06-15',  600), ('u2-16', '2', '2026-06-16',  840),
  ('u2-17', '2', '2026-06-17',  720), ('u2-18', '2', '2026-06-18',  750)
ON CONFLICT (id) DO NOTHING;

-- Meios de pagamento — Junho 2026
INSERT INTO meios_pagamento (unidade_id, ano, mes, forma, valor, cor) VALUES
  ('1', 2026, 5, 'Pix',        8160, '#10B981'),
  ('1', 2026, 5, 'Débito',     5100, '#3B82F6'),
  ('1', 2026, 5, 'Visa',       3060, '#8B5CF6'),
  ('1', 2026, 5, 'Mastercard', 2040, '#F59E0B'),
  ('1', 2026, 5, 'Dinheiro',   1840, '#6B7280'),
  ('2', 2026, 5, 'Pix',        4920, '#10B981'),
  ('2', 2026, 5, 'Débito',     3075, '#3B82F6'),
  ('2', 2026, 5, 'Visa',       1845, '#8B5CF6'),
  ('2', 2026, 5, 'Mastercard', 1230, '#F59E0B'),
  ('2', 2026, 5, 'Dinheiro',   1430, '#6B7280')
ON CONFLICT (unidade_id, ano, mes, forma) DO NOTHING;

-- Fornecedores
INSERT INTO fornecedores (id, nome, categoria) VALUES
  ('1',  'Moinho Taquariense',   'Mercearia'),
  ('2',  'Tirol',                'Laticínios'),
  ('3',  'Jean Bebidas',         'Bebidas'),
  ('4',  'Cordial',              'Mercearia'),
  ('5',  'Baristo',              'Confeitaria'),
  ('6',  'Aviário Lembek',       'Ovos / Aves'),
  ('7',  'Linguiça Maroca',      'Carnes'),
  ('8',  'Litoral Embalagem',    'Embalagens'),
  ('9',  'Nenem Polvilho',       'Mercearia'),
  ('10', 'Biscoito Gabriel',     'Biscoitos'),
  ('11', 'Casa do Panificador',  'Mercearia'),
  ('12', 'Rebelo Água',          'Bebidas'),
  ('13', 'CELESC',               'Concessionária'),
  ('14', 'SAMAE',                'Concessionária')
ON CONFLICT (id) DO NOTHING;

-- Produtos
INSERT INTO produtos (id, nome, unidade, categoria) VALUES
  ('1',  'Farinha de Trigo',       'KG', 'Mercearia'),
  ('2',  'Leite Integral',         'L',  'Laticínios'),
  ('3',  'Margarina Industrial',   'KG', 'Laticínios'),
  ('4',  'Ovos',                   'DZ', 'Ovos / Aves'),
  ('5',  'Açúcar Cristal',         'KG', 'Mercearia'),
  ('6',  'Fermento Biológico',     'KG', 'Mercearia'),
  ('7',  'Chocolate Cobertura',    'KG', 'Confeitaria'),
  ('8',  'Creme de Leite',         'L',  'Laticínios'),
  ('9',  'Linguiça',               'KG', 'Carnes'),
  ('10', 'Sal',                    'KG', 'Mercearia'),
  ('11', 'Refrigerante',           'UN', 'Bebidas'),
  ('12', 'Polvilho',               'KG', 'Mercearia'),
  ('13', 'Biscoito',               'KG', 'Biscoitos'),
  ('14', 'Doce de Leite',          'KG', 'Laticínios'),
  ('15', 'Manteiga',               'KG', 'Laticínios'),
  ('16', 'Óleo de Soja',           'L',  'Mercearia'),
  ('17', 'Embalagens Pão',         'UN', 'Embalagens'),
  ('18', 'Embalagens Confeitaria', 'UN', 'Embalagens'),
  ('19', 'Fermento Químico',       'KG', 'Mercearia'),
  ('20', 'Água Mineral',           'UN', 'Bebidas')
ON CONFLICT (id) DO NOTHING;

-- Unidades de medida
INSERT INTO unidades_medida (id, sigla, descricao) VALUES
  ('1', 'KG',   'Quilograma'),
  ('2', 'L',    'Litro'),
  ('3', 'UN',   'Unidade'),
  ('4', 'DZ',   'Dúzia'),
  ('5', 'CX',   'Caixa'),
  ('6', 'PC',   'Pacote'),
  ('7', 'MACO', 'Maço')
ON CONFLICT (id) DO NOTHING;

-- Categorias de compra
INSERT INTO categorias_compra (id, nome) VALUES
  ('1', 'Mercearia'),
  ('2', 'Laticínios'),
  ('3', 'Carnes'),
  ('4', 'Bebidas'),
  ('5', 'Confeitaria'),
  ('6', 'Embalagens'),
  ('7', 'Ovos / Aves'),
  ('8', 'Biscoitos')
ON CONFLICT (id) DO NOTHING;

-- Categorias de boleto
INSERT INTO categorias_boleto (id, nome, subcategorias) VALUES
  ('1', 'Folha de Pagamento', ARRAY['Salários','Pró Labore','Encargos','Férias / 13º']),
  ('2', 'Impostos',           ARRAY['Simples Nacional','ISS','IPTU','Alvará']),
  ('3', 'Despesas ADM',       ARRAY['Aluguel','Energia Elétrica','Água e Esgoto','Internet','Segurança','Contabilidade','Sistema']),
  ('4', 'Compra de Insumos',  ARRAY['Farinha','Laticínios','Confeitaria','Bebidas','Embalagens','Carnes','Ovos / Aves','Mercearia']),
  ('5', 'Manutenção',         ARRAY['Equipamentos','Instalações','Veículos']),
  ('6', 'Despesas Financeiras', ARRAY['Juros','Taxas Bancárias','IOF']),
  ('7', 'Investimento',       ARRAY['Equipamentos','Obras / Reformas','Marketing'])
ON CONFLICT (id) DO NOTHING;

-- Compras — Junho 2026
INSERT INTO compras (id, unidade_id, data, produto, fornecedor, categoria, quantidade, unidade, valor_unitario, valor_total) VALUES
  ('1',  '1', '2026-06-02', 'Farinha de Trigo',       'Moinho Taquariense',  'Mercearia',   50,   'KG', 4.80,  240.0),
  ('2',  '2', '2026-06-02', 'Leite Integral',         'Tirol',               'Laticínios',  20,   'L',  3.90,   78.0),
  ('3',  '1', '2026-06-03', 'Margarina Industrial',   'Casa do Panificador', 'Mercearia',   10,   'KG', 18.50, 185.0),
  ('4',  '2', '2026-06-04', 'Ovos',                   'Aviário Lembek',      'Ovos / Aves', 30,   'DZ', 8.50,  255.0),
  ('5',  '1', '2026-06-05', 'Açúcar Cristal',         'Cordial',             'Mercearia',   25,   'KG', 3.20,   80.0),
  ('6',  '2', '2026-06-05', 'Fermento Biológico',     'Casa do Panificador', 'Mercearia',    2,   'KG', 22.00,  44.0),
  ('7',  '1', '2026-06-07', 'Embalagens Pão',         'Litoral Embalagem',   'Embalagens', 1000,  'UN', 0.15,  150.0),
  ('8',  '1', '2026-06-09', 'Chocolate Cobertura',    'Baristo',             'Confeitaria',  5,   'KG', 32.00, 160.0),
  ('9',  '2', '2026-06-10', 'Creme de Leite',         'Tirol',               'Laticínios',  10,   'L',  12.80, 128.0),
  ('10', '1', '2026-06-11', 'Linguiça',               'Linguiça Maroca',     'Carnes',       8,   'KG', 24.00, 192.0),
  ('11', '2', '2026-06-12', 'Sal',                    'Cordial',             'Mercearia',    5,   'KG', 2.50,   12.5),
  ('12', '1', '2026-06-13', 'Refrigerantes',          'Jean Bebidas',        'Bebidas',     24,   'UN', 3.80,   91.2),
  ('13', '2', '2026-06-14', 'Polvilho',               'Nenem Polvilho',      'Mercearia',   10,   'KG', 9.80,   98.0),
  ('14', '1', '2026-06-16', 'Biscoito',               'Biscoito Gabriel',    'Biscoitos',   20,   'KG', 18.00, 360.0),
  ('15', '2', '2026-06-17', 'Doce de Leite',          'Tirol',               'Laticínios',   5,   'KG', 22.50, 112.5),
  ('16', '1', '2026-06-18', 'Embalagens Confeitaria', 'Litoral Embalagem',   'Embalagens',  500,  'UN', 0.25,  125.0),
  ('17', '1', '2026-06-19', 'Manteiga',               'Tirol',               'Laticínios',   3,   'KG', 42.00, 126.0),
  ('18', '2', '2026-06-20', 'Óleo de Soja',           'Cordial',             'Mercearia',    6,   'L',  8.50,   51.0),
  ('19', '1', '2026-06-21', 'Farinha de Trigo',       'Moinho Taquariense',  'Mercearia',  100,   'KG', 4.80,  480.0),
  ('20', '2', '2026-06-23', 'Leite Integral',         'Tirol',               'Laticínios',  30,   'L',  3.90,  117.0)
ON CONFLICT (id) DO NOTHING;

-- Boletos — Julho 2026
INSERT INTO boletos (id, unidade_id, fornecedor, categoria, sub_categoria, valor, vencimento, status, vinculado_compra) VALUES
  ('1',  '1', 'CELESC',             'Despesas ADM',       'Energia Elétrica', 2800, '2026-07-10', 'pago',     false),
  ('2',  '1', 'SAMAE',              'Despesas ADM',       'Água e Esgoto',     380, '2026-07-10', 'pago',     false),
  ('3',  '1', 'Moinho Taquariense', 'Compra de Insumos',  'Farinha',          4200, '2026-07-15', 'pendente', true),
  ('4',  '2', 'Tirol',              'Compra de Insumos',  'Laticínios',       1850, '2026-07-18', 'pendente', true),
  ('5',  '1', 'Funcionários',       'Folha de Pagamento', 'Salários',         6500, '2026-07-05', 'pago',     false),
  ('6',  '1', 'Receita Federal',    'Impostos',           'Simples Nacional', 1950, '2026-06-20', 'vencido',  false),
  ('7',  '1', 'Proprietário',       'Despesas ADM',       'Aluguel',          3200, '2026-07-01', 'pago',     false),
  ('8',  '2', 'Provedor Internet',  'Despesas ADM',       'Internet',          180, '2026-07-20', 'pendente', false),
  ('9',  '2', 'Simas Alarme',       'Despesas ADM',       'Segurança',         120, '2026-07-15', 'pendente', false),
  ('10', '1', 'Contabilidade',      'Despesas ADM',       'Contabilidade',     350, '2026-06-30', 'vencido',  false),
  ('11', '2', 'Jean Bebidas',       'Compra de Insumos',  'Bebidas',           650, '2026-07-25', 'pendente', true),
  ('12', '1', 'Baristo',            'Compra de Insumos',  'Confeitaria',       960, '2026-07-22', 'pendente', true),
  ('13', '1', 'Litoral Embalagem',  'Compra de Insumos',  'Embalagens',        275, '2026-07-28', 'pendente', true),
  ('14', '2', 'Asseinfo',           'Despesas ADM',       'Sistema',            89, '2026-07-20', 'pendente', false),
  ('15', '1', 'Nacional Sistema',   'Despesas ADM',       'Sistema',           145, '2026-07-20', 'pendente', false),
  ('16', '2', 'Funcionários',       'Folha de Pagamento', 'Salários',         2550, '2026-07-05', 'pago',     false),
  ('17', '2', 'Proprietário',       'Despesas ADM',       'Aluguel',          1800, '2026-07-01', 'pago',     false)
ON CONFLICT (id) DO NOTHING;

-- Metas 2026
INSERT INTO metas (unidade_id, tipo, categoria_key, periodo, ano, valor, percentual) VALUES
  (null, 'faturamento', null,           'anual',  2026, 400000, null),
  (null, 'faturamento', null,           'mensal', 2026,  34000, null),
  (null, 'lucro',       null,           'anual',  2026,  48000, null),
  (null, 'lucro',       null,           'mensal', 2026,   4000, null),
  (null, 'despesa',     'compraInsumos','anual',  2026,   null, 40),
  (null, 'despesa',     'folhaPagamento','anual', 2026,   null, 28),
  (null, 'despesa',     'impostos',     'anual',  2026,   null, 6),
  (null, 'despesa',     'despesasAdm',  'anual',  2026,   null, 5),
  (null, 'despesa',     'manutencao',   'anual',  2026,   null, 2);
