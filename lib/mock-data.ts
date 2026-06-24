import type {
  DREMes,
  DREMesUnidade,
  Compra,
  Boleto,
  Produto,
  Fornecedor,
  Categoria,
  CategoriaCompra,
  CategoriaBoleto,
  UnidadeMedida,
  Usuario,
  Insight,
  MeioPagamento,
  Unidade,
  FaturamentoDia,
  InsumoABC,
} from '@/types';

// ── Unidades da Padaria ────────────────────────────────────────
export const unidadesPadaria: Unidade[] = [
  {
    id: '1',
    nome: 'Unidade Centro',
    cnpj: '12.345.678/0001-01',
    endereco: 'Rua XV de Novembro, 480 — Centro',
    responsavel: 'Maria Silva',
  },
  {
    id: '2',
    nome: 'Unidade Bairro',
    cnpj: '12.345.678/0002-82',
    endereco: 'Av. Getúlio Vargas, 1200 — Boa Vista',
    responsavel: 'João Santos',
  },
];

// ── DRE por Unidade (Jan–Jun 2026) ────────────────────────────
export const dreMensalU1: DREMesUnidade[] = [
  { mes: 'Jan', unidadeId: '1', faturamentoTotal: 17200, faturamentoReal: 16400, compraInsumos: 6600, folhaPagamento: 3800, impostos: 1030, despesasAdm: 520, manutencao: 150, investimento: 2000, proLabore: 1800, retiraSocio: 900, despesasTotal: 16800, lucro: -400 },
  { mes: 'Fev', unidadeId: '1', faturamentoTotal: 18000, faturamentoReal: 17200, compraInsumos: 7000, folhaPagamento: 3800, impostos: 1080, despesasAdm: 560, manutencao: 250, investimento: 0, proLabore: 1800, retiraSocio: 900, despesasTotal: 15390, lucro: 1810 },
  { mes: 'Mar', unidadeId: '1', faturamentoTotal: 18800, faturamentoReal: 18000, compraInsumos: 7200, folhaPagamento: 3950, impostos: 1130, despesasAdm: 600, manutencao: 300, investimento: 0, proLabore: 1800, retiraSocio: 900, despesasTotal: 15880, lucro: 2120 },
  { mes: 'Abr', unidadeId: '1', faturamentoTotal: 18100, faturamentoReal: 17300, compraInsumos: 7000, folhaPagamento: 3950, impostos: 1080, despesasAdm: 550, manutencao: 200, investimento: 0, proLabore: 1800, retiraSocio: 900, despesasTotal: 15480, lucro: 1820 },
  { mes: 'Mai', unidadeId: '1', faturamentoTotal: 19400, faturamentoReal: 18500, compraInsumos: 7400, folhaPagamento: 3950, impostos: 1160, despesasAdm: 580, manutencao: 280, investimento: 0, proLabore: 1800, retiraSocio: 900, despesasTotal: 16070, lucro: 2430 },
  { mes: 'Jun', unidadeId: '1', faturamentoTotal: 19200, faturamentoReal: 18300, compraInsumos: 7500, folhaPagamento: 3950, impostos: 1150, despesasAdm: 600, manutencao: 320, investimento: 0, proLabore: 1800, retiraSocio: 900, despesasTotal: 16220, lucro: 2080 },
];

export const dreMensalU2: DREMesUnidade[] = [
  { mes: 'Jan', unidadeId: '2', faturamentoTotal: 12000, faturamentoReal: 11500, compraInsumos: 4800, folhaPagamento: 2400, impostos: 720, despesasAdm: 330, manutencao: 50, investimento: 0, proLabore: 1200, retiraSocio: 600, despesasTotal: 10100, lucro: 1400 },
  { mes: 'Fev', unidadeId: '2', faturamentoTotal: 12400, faturamentoReal: 11900, compraInsumos: 4900, folhaPagamento: 2400, impostos: 740, despesasAdm: 360, manutencao: 100, investimento: 0, proLabore: 1200, retiraSocio: 600, despesasTotal: 10300, lucro: 1600 },
  { mes: 'Mar', unidadeId: '2', faturamentoTotal: 13100, faturamentoReal: 12500, compraInsumos: 5200, folhaPagamento: 2550, impostos: 790, despesasAdm: 380, manutencao: 150, investimento: 0, proLabore: 1200, retiraSocio: 600, despesasTotal: 10870, lucro: 1630 },
  { mes: 'Abr', unidadeId: '2', faturamentoTotal: 12800, faturamentoReal: 12300, compraInsumos: 5100, folhaPagamento: 2550, impostos: 770, despesasAdm: 350, manutencao: 100, investimento: 0, proLabore: 1200, retiraSocio: 600, despesasTotal: 10670, lucro: 1630 },
  { mes: 'Mai', unidadeId: '2', faturamentoTotal: 13600, faturamentoReal: 13000, compraInsumos: 5300, folhaPagamento: 2550, impostos: 820, despesasAdm: 370, manutencao: 120, investimento: 0, proLabore: 1200, retiraSocio: 600, despesasTotal: 10960, lucro: 2040 },
  { mes: 'Jun', unidadeId: '2', faturamentoTotal: 13500, faturamentoReal: 12800, compraInsumos: 5300, folhaPagamento: 2550, impostos: 800, despesasAdm: 380, manutencao: 130, investimento: 0, proLabore: 1200, retiraSocio: 600, despesasTotal: 10960, lucro: 1840 },
];

// DRE consolidado (soma das duas unidades)
function somaDRE(a: DREMes, b: DREMes): DREMes {
  return {
    mes: a.mes,
    faturamentoTotal: a.faturamentoTotal + b.faturamentoTotal,
    faturamentoReal: a.faturamentoReal + b.faturamentoReal,
    compraInsumos: a.compraInsumos + b.compraInsumos,
    folhaPagamento: a.folhaPagamento + b.folhaPagamento,
    impostos: a.impostos + b.impostos,
    despesasAdm: a.despesasAdm + b.despesasAdm,
    manutencao: a.manutencao + b.manutencao,
    investimento: a.investimento + b.investimento,
    proLabore: a.proLabore + b.proLabore,
    retiraSocio: a.retiraSocio + b.retiraSocio,
    despesasTotal: a.despesasTotal + b.despesasTotal,
    lucro: a.lucro + b.lucro,
  };
}

export const dreMensal: DREMes[] = dreMensalU1.map((u1, i) => somaDRE(u1, dreMensalU2[i]));
export const dreAtual: DREMes = dreMensal[5];
export const dreMesAnterior: DREMes = dreMensal[4];
export const dreAtualU1: DREMesUnidade = dreMensalU1[5];
export const dreAtualU2: DREMesUnidade = dreMensalU2[5];

// ── Faturamento Diário — Junho 2026 ──────────────────────────
const diasJunho = Array.from({ length: 18 }, (_, i) => {
  const d = i + 1;
  return `2026-06-${String(d).padStart(2, '0')}`;
});

export const faturamentoDiario: FaturamentoDia[] = [
  // Unidade 1
  ...diasJunho.map((data, i) => ({
    id: `u1-${i + 1}`,
    data,
    unidadeId: '1' as const,
    valor: [980, 1050, 0, 1120, 890, 1230, 1100, 670, 1050, 1080, 0, 960, 1020, 1150, 880, 1200, 1040, 1090][i],
  })),
  // Unidade 2
  ...diasJunho.map((data, i) => ({
    id: `u2-${i + 1}`,
    data,
    unidadeId: '2' as const,
    valor: [640, 710, 0, 790, 580, 810, 760, 430, 700, 730, 0, 650, 680, 790, 600, 840, 720, 750][i],
  })),
];

// ── Meios de Pagamento ─────────────────────────────────────────
export const meiosPagamento: MeioPagamento[] = [
  { nome: 'Pix', valor: 13080, cor: '#10B981' },
  { nome: 'Débito', valor: 8175, cor: '#3B82F6' },
  { nome: 'Visa', valor: 4905, cor: '#8B5CF6' },
  { nome: 'Mastercard', valor: 3270, cor: '#F59E0B' },
  { nome: 'Dinheiro', valor: 3270, cor: '#6B7280' },
];

// ── Compras (com unidadeId) ────────────────────────────────────
export const compras: Compra[] = [
  { id: '1',  data: '2026-06-02', produto: 'Farinha de Trigo',      fornecedor: 'Moinho Taquariense', categoria: 'Mercearia',    quantidade: 50,   unidade: 'KG', valorUnitario: 4.80,  valorTotal: 240.0,  unidadeId: '1' },
  { id: '2',  data: '2026-06-02', produto: 'Leite Integral',        fornecedor: 'Tirol',              categoria: 'Laticínios',   quantidade: 20,   unidade: 'L',  valorUnitario: 3.90,  valorTotal: 78.0,   unidadeId: '2' },
  { id: '3',  data: '2026-06-03', produto: 'Margarina Industrial',  fornecedor: 'Casa do Panificador',categoria: 'Mercearia',    quantidade: 10,   unidade: 'KG', valorUnitario: 18.50, valorTotal: 185.0,  unidadeId: '1' },
  { id: '4',  data: '2026-06-04', produto: 'Ovos',                  fornecedor: 'Aviário Lembek',     categoria: 'Ovos / Aves',  quantidade: 30,   unidade: 'DZ', valorUnitario: 8.50,  valorTotal: 255.0,  unidadeId: '2' },
  { id: '5',  data: '2026-06-05', produto: 'Açúcar Cristal',        fornecedor: 'Cordial',            categoria: 'Mercearia',    quantidade: 25,   unidade: 'KG', valorUnitario: 3.20,  valorTotal: 80.0,   unidadeId: '1' },
  { id: '6',  data: '2026-06-05', produto: 'Fermento Biológico',    fornecedor: 'Casa do Panificador',categoria: 'Mercearia',    quantidade: 2,    unidade: 'KG', valorUnitario: 22.00, valorTotal: 44.0,   unidadeId: '2' },
  { id: '7',  data: '2026-06-07', produto: 'Embalagens Pão',        fornecedor: 'Litoral Embalagem',  categoria: 'Embalagens',   quantidade: 1000, unidade: 'UN', valorUnitario: 0.15,  valorTotal: 150.0,  unidadeId: '1' },
  { id: '8',  data: '2026-06-09', produto: 'Chocolate Cobertura',   fornecedor: 'Baristo',            categoria: 'Confeitaria',  quantidade: 5,    unidade: 'KG', valorUnitario: 32.00, valorTotal: 160.0,  unidadeId: '1' },
  { id: '9',  data: '2026-06-10', produto: 'Creme de Leite',        fornecedor: 'Tirol',              categoria: 'Laticínios',   quantidade: 10,   unidade: 'L',  valorUnitario: 12.80, valorTotal: 128.0,  unidadeId: '2' },
  { id: '10', data: '2026-06-11', produto: 'Linguiça',              fornecedor: 'Linguiça Maroca',    categoria: 'Carnes',       quantidade: 8,    unidade: 'KG', valorUnitario: 24.00, valorTotal: 192.0,  unidadeId: '1' },
  { id: '11', data: '2026-06-12', produto: 'Sal',                   fornecedor: 'Cordial',            categoria: 'Mercearia',    quantidade: 5,    unidade: 'KG', valorUnitario: 2.50,  valorTotal: 12.5,   unidadeId: '2' },
  { id: '12', data: '2026-06-13', produto: 'Refrigerantes',         fornecedor: 'Jean Bebidas',       categoria: 'Bebidas',      quantidade: 24,   unidade: 'UN', valorUnitario: 3.80,  valorTotal: 91.2,   unidadeId: '1' },
  { id: '13', data: '2026-06-14', produto: 'Polvilho',              fornecedor: 'Nenem Polvilho',     categoria: 'Mercearia',    quantidade: 10,   unidade: 'KG', valorUnitario: 9.80,  valorTotal: 98.0,   unidadeId: '2' },
  { id: '14', data: '2026-06-16', produto: 'Biscoito',              fornecedor: 'Biscoito Gabriel',   categoria: 'Biscoitos',    quantidade: 20,   unidade: 'KG', valorUnitario: 18.00, valorTotal: 360.0,  unidadeId: '1' },
  { id: '15', data: '2026-06-17', produto: 'Doce de Leite',         fornecedor: 'Tirol',              categoria: 'Laticínios',   quantidade: 5,    unidade: 'KG', valorUnitario: 22.50, valorTotal: 112.5,  unidadeId: '2' },
  { id: '16', data: '2026-06-18', produto: 'Embalagens Confeitaria',fornecedor: 'Litoral Embalagem',  categoria: 'Embalagens',   quantidade: 500,  unidade: 'UN', valorUnitario: 0.25,  valorTotal: 125.0,  unidadeId: '1' },
  { id: '17', data: '2026-06-19', produto: 'Manteiga',              fornecedor: 'Tirol',              categoria: 'Laticínios',   quantidade: 3,    unidade: 'KG', valorUnitario: 42.00, valorTotal: 126.0,  unidadeId: '1' },
  { id: '18', data: '2026-06-20', produto: 'Óleo de Soja',          fornecedor: 'Cordial',            categoria: 'Mercearia',    quantidade: 6,    unidade: 'L',  valorUnitario: 8.50,  valorTotal: 51.0,   unidadeId: '2' },
  { id: '19', data: '2026-06-21', produto: 'Farinha de Trigo',      fornecedor: 'Moinho Taquariense', categoria: 'Mercearia',    quantidade: 100,  unidade: 'KG', valorUnitario: 4.80,  valorTotal: 480.0,  unidadeId: '1' },
  { id: '20', data: '2026-06-23', produto: 'Leite Integral',        fornecedor: 'Tirol',              categoria: 'Laticínios',   quantidade: 30,   unidade: 'L',  valorUnitario: 3.90,  valorTotal: 117.0,  unidadeId: '2' },
];

// ── Boletos (com unidadeId e vinculação) ──────────────────────
export const boletos: Boleto[] = [
  { id: '1',  fornecedor: 'CELESC',             categoria: 'Despesas ADM',      subCategoria: 'Energia Elétrica',  valor: 2800, vencimento: '2026-07-10', status: 'pago',     unidadeId: '1' },
  { id: '2',  fornecedor: 'SAMAE',              categoria: 'Despesas ADM',      subCategoria: 'Água e Esgoto',     valor: 380,  vencimento: '2026-07-10', status: 'pago',     unidadeId: '1' },
  { id: '3',  fornecedor: 'Moinho Taquariense', categoria: 'Compra de Insumos', subCategoria: 'Farinha',           valor: 4200, vencimento: '2026-07-15', status: 'pendente', unidadeId: '1', vinculadoCompra: true },
  { id: '4',  fornecedor: 'Tirol',              categoria: 'Compra de Insumos', subCategoria: 'Laticínios',        valor: 1850, vencimento: '2026-07-18', status: 'pendente', unidadeId: '2', vinculadoCompra: true },
  { id: '5',  fornecedor: 'Funcionários',        categoria: 'Folha de Pagamento',subCategoria: 'Salários',          valor: 6500, vencimento: '2026-07-05', status: 'pago',     unidadeId: '1' },
  { id: '6',  fornecedor: 'Receita Federal',    categoria: 'Impostos',          subCategoria: 'Simples Nacional',  valor: 1950, vencimento: '2026-06-20', status: 'vencido',  unidadeId: '1' },
  { id: '7',  fornecedor: 'Proprietário',       categoria: 'Despesas ADM',      subCategoria: 'Aluguel',           valor: 3200, vencimento: '2026-07-01', status: 'pago',     unidadeId: '1' },
  { id: '8',  fornecedor: 'Provedor Internet',  categoria: 'Despesas ADM',      subCategoria: 'Internet',          valor: 180,  vencimento: '2026-07-20', status: 'pendente', unidadeId: '2' },
  { id: '9',  fornecedor: 'Simas Alarme',       categoria: 'Despesas ADM',      subCategoria: 'Segurança',         valor: 120,  vencimento: '2026-07-15', status: 'pendente', unidadeId: '2' },
  { id: '10', fornecedor: 'Contabilidade',      categoria: 'Despesas ADM',      subCategoria: 'Contabilidade',     valor: 350,  vencimento: '2026-06-30', status: 'vencido',  unidadeId: '1' },
  { id: '11', fornecedor: 'Jean Bebidas',       categoria: 'Compra de Insumos', subCategoria: 'Bebidas',           valor: 650,  vencimento: '2026-07-25', status: 'pendente', unidadeId: '2', vinculadoCompra: true },
  { id: '12', fornecedor: 'Baristo',            categoria: 'Compra de Insumos', subCategoria: 'Confeitaria',       valor: 960,  vencimento: '2026-07-22', status: 'pendente', unidadeId: '1', vinculadoCompra: true },
  { id: '13', fornecedor: 'Litoral Embalagem',  categoria: 'Compra de Insumos', subCategoria: 'Embalagens',        valor: 275,  vencimento: '2026-07-28', status: 'pendente', unidadeId: '1', vinculadoCompra: true },
  { id: '14', fornecedor: 'Asseinfo',           categoria: 'Despesas ADM',      subCategoria: 'Sistema',           valor: 89,   vencimento: '2026-07-20', status: 'pendente', unidadeId: '2' },
  { id: '15', fornecedor: 'Nacional Sistema',   categoria: 'Despesas ADM',      subCategoria: 'Sistema',           valor: 145,  vencimento: '2026-07-20', status: 'pendente', unidadeId: '1' },
  { id: '16', fornecedor: 'Funcionários',        categoria: 'Folha de Pagamento',subCategoria: 'Salários',          valor: 2550, vencimento: '2026-07-05', status: 'pago',     unidadeId: '2' },
  { id: '17', fornecedor: 'Proprietário',       categoria: 'Despesas ADM',      subCategoria: 'Aluguel',           valor: 1800, vencimento: '2026-07-01', status: 'pago',     unidadeId: '2' },
];

// ── Produtos ─────────────────────────────────────────────────
export const produtos: Produto[] = [
  { id: '1',  nome: 'Farinha de Trigo',        unidade: 'KG', categoria: 'Mercearia' },
  { id: '2',  nome: 'Leite Integral',          unidade: 'L',  categoria: 'Laticínios' },
  { id: '3',  nome: 'Margarina Industrial',    unidade: 'KG', categoria: 'Laticínios' },
  { id: '4',  nome: 'Ovos',                    unidade: 'DZ', categoria: 'Ovos / Aves' },
  { id: '5',  nome: 'Açúcar Cristal',          unidade: 'KG', categoria: 'Mercearia' },
  { id: '6',  nome: 'Fermento Biológico',      unidade: 'KG', categoria: 'Mercearia' },
  { id: '7',  nome: 'Chocolate Cobertura',     unidade: 'KG', categoria: 'Confeitaria' },
  { id: '8',  nome: 'Creme de Leite',          unidade: 'L',  categoria: 'Laticínios' },
  { id: '9',  nome: 'Linguiça',                unidade: 'KG', categoria: 'Carnes' },
  { id: '10', nome: 'Sal',                     unidade: 'KG', categoria: 'Mercearia' },
  { id: '11', nome: 'Refrigerante',            unidade: 'UN', categoria: 'Bebidas' },
  { id: '12', nome: 'Polvilho',                unidade: 'KG', categoria: 'Mercearia' },
  { id: '13', nome: 'Biscoito',                unidade: 'KG', categoria: 'Biscoitos' },
  { id: '14', nome: 'Doce de Leite',           unidade: 'KG', categoria: 'Laticínios' },
  { id: '15', nome: 'Manteiga',                unidade: 'KG', categoria: 'Laticínios' },
  { id: '16', nome: 'Óleo de Soja',            unidade: 'L',  categoria: 'Mercearia' },
  { id: '17', nome: 'Embalagens Pão',          unidade: 'UN', categoria: 'Embalagens' },
  { id: '18', nome: 'Embalagens Confeitaria',  unidade: 'UN', categoria: 'Embalagens' },
  { id: '19', nome: 'Fermento Químico',        unidade: 'KG', categoria: 'Mercearia' },
  { id: '20', nome: 'Água Mineral',            unidade: 'UN', categoria: 'Bebidas' },
];

// ── Fornecedores ─────────────────────────────────────────────
export const fornecedores: Fornecedor[] = [
  { id: '1',  nome: 'Moinho Taquariense', categoria: 'Mercearia' },
  { id: '2',  nome: 'Tirol',             categoria: 'Laticínios' },
  { id: '3',  nome: 'Jean Bebidas',      categoria: 'Bebidas' },
  { id: '4',  nome: 'Cordial',           categoria: 'Mercearia' },
  { id: '5',  nome: 'Baristo',           categoria: 'Confeitaria' },
  { id: '6',  nome: 'Aviário Lembek',    categoria: 'Ovos / Aves' },
  { id: '7',  nome: 'Linguiça Maroca',   categoria: 'Carnes' },
  { id: '8',  nome: 'Litoral Embalagem', categoria: 'Embalagens' },
  { id: '9',  nome: 'Nenem Polvilho',    categoria: 'Mercearia' },
  { id: '10', nome: 'Biscoito Gabriel',  categoria: 'Biscoitos' },
  { id: '11', nome: 'Casa do Panificador', categoria: 'Mercearia' },
  { id: '12', nome: 'Rebelo Água',       categoria: 'Bebidas' },
  { id: '13', nome: 'CELESC',            categoria: 'Concessionária' },
  { id: '14', nome: 'SAMAE',             categoria: 'Concessionária' },
];

// ── Categorias de Compras (módulo próprio) ────────────────────
export const categoriasCompra: CategoriaCompra[] = [
  { id: '1', nome: 'Mercearia' },
  { id: '2', nome: 'Laticínios' },
  { id: '3', nome: 'Carnes' },
  { id: '4', nome: 'Bebidas' },
  { id: '5', nome: 'Confeitaria' },
  { id: '6', nome: 'Embalagens' },
  { id: '7', nome: 'Ovos / Aves' },
  { id: '8', nome: 'Biscoitos' },
];

// ── Categorias de Boletos (hierarquia principal → subcategoria) ─
export const categoriasBoleto: CategoriaBoleto[] = [
  { id: '1', nome: 'Folha de Pagamento', subcategorias: ['Salários', 'Pró Labore', 'Encargos', 'Férias / 13º'] },
  { id: '2', nome: 'Impostos',           subcategorias: ['Simples Nacional', 'ISS', 'IPTU', 'Alvará'] },
  { id: '3', nome: 'Despesas ADM',       subcategorias: ['Aluguel', 'Energia Elétrica', 'Água e Esgoto', 'Internet', 'Segurança', 'Contabilidade', 'Sistema'] },
  { id: '4', nome: 'Compra de Insumos',  subcategorias: ['Farinha', 'Laticínios', 'Confeitaria', 'Bebidas', 'Embalagens', 'Carnes', 'Ovos / Aves', 'Mercearia'] },
  { id: '5', nome: 'Manutenção',         subcategorias: ['Equipamentos', 'Instalações', 'Veículos'] },
  { id: '6', nome: 'Despesas Financeiras', subcategorias: ['Juros', 'Taxas Bancárias', 'IOF'] },
  { id: '7', nome: 'Investimento',       subcategorias: ['Equipamentos', 'Obras / Reformas', 'Marketing'] },
];

// ── Categorias (legado, usada em algumas telas) ───────────────
export const categorias: Categoria[] = [
  { id: '1', nome: 'Compra de Insumos',  tipo: 'despesa', grupoDRE: 'CMV' },
  { id: '2', nome: 'Folha de Pagamento', tipo: 'despesa', grupoDRE: 'Despesas Pessoal' },
  { id: '3', nome: 'Impostos',           tipo: 'despesa', grupoDRE: 'Impostos' },
  { id: '4', nome: 'Despesas ADM',       tipo: 'despesa', grupoDRE: 'Despesas Operacionais' },
  { id: '5', nome: 'Manutenção',         tipo: 'despesa', grupoDRE: 'Despesas Operacionais' },
  { id: '6', nome: 'Investimento',       tipo: 'despesa', grupoDRE: 'Despesas Operacionais' },
  { id: '7', nome: 'Pró Labore',         tipo: 'despesa', grupoDRE: 'Despesas Pessoal' },
  { id: '8', nome: 'Retira Sócio',       tipo: 'despesa', grupoDRE: 'Despesas Pessoal' },
  { id: '9', nome: 'Faturamento',        tipo: 'receita', grupoDRE: 'Receita Bruta' },
];

// ── Unidades de Medida ────────────────────────────────────────
export const unidades: UnidadeMedida[] = [
  { id: '1', sigla: 'KG',   descricao: 'Quilograma' },
  { id: '2', sigla: 'L',    descricao: 'Litro' },
  { id: '3', sigla: 'UN',   descricao: 'Unidade' },
  { id: '4', sigla: 'DZ',   descricao: 'Dúzia' },
  { id: '5', sigla: 'CX',   descricao: 'Caixa' },
  { id: '6', sigla: 'PC',   descricao: 'Pacote' },
  { id: '7', sigla: 'MACO', descricao: 'Maço' },
];

// ── Usuários ──────────────────────────────────────────────────
export const usuarios: Usuario[] = [
  { id: '1', nome: 'Maria Silva',  email: 'maria@paoquente.com.br', perfil: 'Administrador',    ativo: true,  verHistoricoFaturamento: true,  unidadeRestrita: null, verIndicadoresSensiveis: true },
  { id: '2', nome: 'João Santos',  email: 'joao@paoquente.com.br',  perfil: 'Gestor Financeiro',ativo: true,  verHistoricoFaturamento: true,  unidadeRestrita: null, verIndicadoresSensiveis: true },
  { id: '3', nome: 'Ana Oliveira', email: 'ana@paoquente.com.br',   perfil: 'Operacional',      ativo: true,  verHistoricoFaturamento: false, unidadeRestrita: '1',  verIndicadoresSensiveis: false },
  { id: '4', nome: 'Pedro Costa',  email: 'pedro@paoquente.com.br', perfil: 'Operacional',      ativo: true,  verHistoricoFaturamento: false, unidadeRestrita: '2',  verIndicadoresSensiveis: false },
  { id: '5', nome: 'Carla Lima',   email: 'carla@paoquente.com.br', perfil: 'Visualizador',     ativo: false, verHistoricoFaturamento: true,  unidadeRestrita: null, verIndicadoresSensiveis: false },
];

// ── Curva ABC de Insumos ───────────────────────────────────────
export const curvaABC: InsumoABC[] = (() => {
  const agrupado: Record<string, { produto: string; fornecedor: string; total: number }> = {};
  for (const c of compras) {
    const key = c.produto;
    if (!agrupado[key]) agrupado[key] = { produto: c.produto, fornecedor: c.fornecedor, total: 0 };
    agrupado[key].total += c.valorTotal;
  }
  const lista = Object.values(agrupado).sort((a, b) => b.total - a.total);
  const totalGeral = lista.reduce((s, x) => s + x.total, 0);
  let acumulado = 0;
  return lista.map((x) => {
    acumulado += x.total;
    const pct = (x.total / totalGeral) * 100;
    const pctAcum = (acumulado / totalGeral) * 100;
    return {
      produto: x.produto,
      fornecedor: x.fornecedor,
      totalGasto: x.total,
      percentual: pct,
      percentualAcumulado: pctAcum,
      classe: pctAcum <= 70 ? 'A' : pctAcum <= 90 ? 'B' : 'C',
    } satisfies InsumoABC;
  });
})();

// ── Insights ──────────────────────────────────────────────────
export const insights: Insight[] = [
  {
    id: '1',
    tipo: 'alerta',
    titulo: 'Folha de pagamento acima do ideal — Unidade Centro',
    descricao: 'A folha da Unidade Centro em Junho representou 21,6% do faturamento real (R$ 3.950 de R$ 18.300). O ideal para o setor é manter abaixo de 18%. Revise a escala ou aumente o faturamento desta unidade.',
    valor: '21,6% do faturamento',
    categoria: 'Recursos Humanos',
  },
  {
    id: '2',
    tipo: 'alerta',
    titulo: '2 boletos vencidos em aberto',
    descricao: 'Simples Nacional (R$ 1.950) e Contabilidade (R$ 350) estão vencidos. Total em atraso: R$ 2.300. Regularize para evitar multas e juros.',
    valor: 'R$ 2.300 em atraso',
    categoria: 'Pagamentos',
  },
  {
    id: '3',
    tipo: 'atencao',
    titulo: 'CMV acima do limite — consolidado',
    descricao: 'O custo de insumos em Junho foi de R$ 12.800, representando 41,2% do faturamento real (R$ 31.100). O ideal para padarias é abaixo de 40%. Unidade Bairro tem CMV de 41,4% — monitore.',
    valor: '41,2% do faturamento',
    categoria: 'Custos',
  },
  {
    id: '4',
    tipo: 'atencao',
    titulo: 'Unidade Centro tem custo de pessoal 4 p.p. acima da Unidade Bairro',
    descricao: 'Custo de pessoal sobre faturamento: Centro 21,6% vs. Bairro 19,9%. A diferença pode indicar escala maior ou ineficiência no Centro — vale comparar o volume de vendas por funcionário.',
    valor: 'Δ 4 p.p.',
    categoria: 'Comparativo Unidades',
  },
  {
    id: '5',
    tipo: 'positivo',
    titulo: 'Faturamento consolidado em crescimento',
    descricao: 'O faturamento total de Junho (R$ 32.700) ficou 12% acima de Janeiro (R$ 29.200). As duas unidades cresceram — Unidade Bairro cresceu 12,5%, ligeiramente acima da Centro (+11,6%).',
    valor: '+12% vs Janeiro',
    categoria: 'Faturamento',
  },
  {
    id: '6',
    tipo: 'positivo',
    titulo: 'Curva ABC: Farinha de Trigo e Biscoito concentram 40% das compras',
    descricao: 'Estes dois itens classe A somam R$ 1.080 no mês. Negociar volume com Moinho Taquariense e Biscoito Gabriel pode gerar economias relevantes. São os itens onde vale priorizar pesquisa de preço.',
    valor: '40% das compras',
    categoria: 'Compras',
  },
];

// ── Análise IA ────────────────────────────────────────────────
export const analiseIA = `
**Análise do período — Junho 2026 · Consolidado (2 unidades)**

O mês de Junho apresentou faturamento consolidado de **R$ 32.700**, com a Unidade Centro contribuindo com R$ 19.200 (58,7%) e a Unidade Bairro com R$ 13.500 (41,3%). Ambas cresceram em relação a Janeiro, o que é um sinal positivo de tração do negócio.

**Comparativo entre unidades:**

A Unidade Bairro surpreende positivamente: com faturamento 30% menor que o Centro, seu lucro (R$ 1.840) representa **14,4% de margem líquida** — enquanto o Centro ficou em **10,8%**. Isso indica que a Bairro opera com estrutura de custos mais enxuta. Entender o que a Bairro faz diferente pode ajudar a otimizar o Centro.

**Pontos de atenção:**

O **custo de insumos em 41,2%** do faturamento real está ligeiramente acima do ideal de 40%. Farinha de Trigo e Biscoito são os itens classe A — merecem atenção na negociação. Os **2 boletos vencidos** (Simples Nacional e Contabilidade) precisam de regularização urgente.

**O que está bem:**

A curva de faturamento é ascendente desde Janeiro. A Unidade Bairro demonstra boa eficiência operacional. O crescimento de 12% no consolidado é saudável.

**Recomendação para Julho:**

Regularizar os boletos vencidos. Negociar volume com os 2 principais fornecedores (Moinho Taquariense e Tirol). Analisar a estrutura de custos do Centro tomando a Bairro como referência.
`;
