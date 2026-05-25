// ============ AUTENTICAÇÃO ============
export interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipo: "admin" | "gerente" | "caixa";
  ativo: boolean;
  created_at?: string;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  usuario: Usuario;
}

// ============ CATEGORIA ============
export interface Categoria {
  id: number;
  nome: string;
  descricao?: string;
  ativa: boolean;
  ordem?: number;
}

// ============ INSUMO ============
export interface Insumo {
  id: number;
  nome: string;
  unidade: string;
  estoque_atual: number;
  estoque_minimo: number;
  custo_unitario: number;
  ativo: boolean;
}

// ============ PRODUTO ============
export interface Produto {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  categoria_id: number;
  categoria?: Categoria;
  imagem_url?: string;
  ativo: boolean;
  tempo_preparo?: number;
  insumos?: ProdutoInsumo[];
}

export interface ProdutoInsumo {
  insumo_id: number;
  insumo?: Insumo;
  quantidade: number;
}

// ============ ADICIONAL ============
export interface Adicional {
  id: number;
  nome: string;
  preco: number;
  categoria_id?: number;
  ativo: boolean;
}

// ============ PROMOÇÃO ============
export interface Promocao {
  id: number;
  nome: string;
  descricao?: string;
  tipo: "percentual" | "valor_fixo" | "leve_pague";
  valor: number;
  data_inicio: string;
  data_fim: string;
  ativa: boolean;
  produtos?: number[];
  categorias?: number[];
}

// ============ VENDA ============
export interface ItemVenda {
  produto_id: number;
  produto?: Produto;
  quantidade: number;
  preco_unitario: number;
  adicionais?: ItemAdicional[];
  observacao?: string;
}

export interface ItemAdicional {
  adicional_id: number;
  adicional?: Adicional;
  quantidade: number;
  preco_unitario: number;
}

export interface Venda {
  id: number;
  numero: string;
  data: string;
  status: "pendente" | "preparando" | "pronto" | "entregue" | "cancelado";
  subtotal: number;
  desconto: number;
  total: number;
  forma_pagamento?: "dinheiro" | "cartao_credito" | "cartao_debito" | "pix";
  itens: ItemVenda[];
  usuario_id?: number;
  usuario?: Usuario;
  cliente_nome?: string;
  observacao?: string;
}

// ============ CARRINHO ============
export interface ItemCarrinho {
  id: string;
  produto: Produto;
  quantidade: number;
  adicionais: { adicional: Adicional; quantidade: number }[];
  observacao?: string;
}

// ============ ESTOQUE ============
export interface MovimentacaoEstoque {
  id: number;
  insumo_id: number;
  insumo?: Insumo;
  tipo: "entrada" | "saida" | "ajuste";
  quantidade: number;
  motivo?: string;
  data: string;
  usuario_id?: number;
  usuario?: Usuario;
}

// ============ RELATÓRIOS ============
export interface ResumoVendas {
  total_vendas: number;
  quantidade_vendas: number;
  ticket_medio: number;
  produtos_vendidos: number;
}

export interface VendasPorPeriodo {
  periodo: string;
  total: number;
  quantidade: number;
}

export interface ProdutoMaisVendido {
  produto_id: number;
  produto_nome: string;
  quantidade: number;
  total: number;
}

// ============ RECOMENDAÇÕES ============
export interface Recomendacao {
  produto_id: number;
  produto?: Produto;
  quantidade_sugerida: number;
  motivo: string;
  prioridade: "alta" | "media" | "baixa";
}

// ============ BACKUP ============
export interface Backup {
  id: number;
  nome: string;
  data: string;
  tamanho: string;
  tipo: "manual" | "automatico";
}

// ============ DASHBOARD ============
export interface DashboardMetricas {
  vendas_hoje: number;
  vendas_semana: number;
  vendas_mes: number;
  ticket_medio: number;
  produtos_baixo_estoque: number;
  pedidos_pendentes: number;
}

// ============ API ============
export interface ApiError {
  detail: string;
  status?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}
