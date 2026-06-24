export interface DREMes {
  mes: string;
  faturamentoTotal: number;
  faturamentoReal: number;
  compraInsumos: number;
  folhaPagamento: number;
  impostos: number;
  despesasAdm: number;
  manutencao: number;
  investimento: number;
  proLabore: number;
  retiraSocio: number;
  despesasTotal: number;
  lucro: number;
}

export interface DREMesUnidade extends DREMes {
  unidadeId: '1' | '2';
}

export interface Unidade {
  id: '1' | '2';
  nome: string;
  cnpj: string;
  endereco: string;
  responsavel: string;
}

export interface FaturamentoDia {
  id: string;
  data: string;
  unidadeId: '1' | '2';
  valor: number;
}

export interface Compra {
  id: string;
  data: string;
  produto: string;
  fornecedor: string;
  categoria: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  valorTotal: number;
  unidadeId: '1' | '2';
}

export type StatusBoleto = 'pago' | 'pendente' | 'vencido';

export interface Boleto {
  id: string;
  fornecedor: string;
  categoria: string;
  subCategoria: string;
  valor: number;
  vencimento: string;
  status: StatusBoleto;
  unidadeId: '1' | '2';
  vinculadoCompra?: boolean;
}

export interface Produto {
  id: string;
  nome: string;
  unidade: string;
  categoria: string;
}

export interface Fornecedor {
  id: string;
  nome: string;
  categoria: string;
}

export interface CategoriaCompra {
  id: string;
  nome: string;
}

export interface CategoriaBoleto {
  id: string;
  nome: string;
  subcategorias: string[];
}

export interface Categoria {
  id: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  grupoDRE: string;
}

export interface UnidadeMedida {
  id: string;
  sigla: string;
  descricao: string;
}

export type PerfilUsuario = 'Administrador' | 'Gestor Financeiro' | 'Operacional' | 'Visualizador';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  verHistoricoFaturamento: boolean;
  unidadeRestrita: '1' | '2' | null;
  verIndicadoresSensiveis: boolean;
}

export type TipoInsight = 'alerta' | 'atencao' | 'positivo';

export interface Insight {
  id: string;
  tipo: TipoInsight;
  titulo: string;
  descricao: string;
  valor?: string;
  categoria: string;
}

export interface MeioPagamento {
  nome: string;
  valor: number;
  cor: string;
}

export interface InsumoABC {
  produto: string;
  fornecedor: string;
  totalGasto: number;
  percentual: number;
  percentualAcumulado: number;
  classe: 'A' | 'B' | 'C';
}
