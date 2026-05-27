const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

type MetodoHttp = "GET" | "POST" | "PUT" | "PATCH";

async function requisitar<T>(caminho: string, opcoes: { metodo?: MetodoHttp; corpo?: unknown } = {}) {
  const token = obterToken();
  const resposta = await fetch(`${API_URL}${caminho}`, {
    method: opcoes.metodo ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opcoes.corpo ? JSON.stringify(opcoes.corpo) : undefined,
  });

  if (!resposta.ok) {
    const erro = (await resposta.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(erro?.detail ?? "Nao foi possivel concluir a operacao.");
  }

  return resposta.json() as Promise<T>;
}

async function requisitarArquivo(caminho: string) {
  const token = obterToken();
  const resposta = await fetch(`${API_URL}${caminho}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!resposta.ok) {
    const erro = (await resposta.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(erro?.detail ?? "Nao foi possivel exportar o relatorio.");
  }

  return resposta.blob();
}

function obterToken() {
  const tokenDireto = localStorage.getItem("foodflow_token");
  if (tokenDireto) return tokenDireto;

  const authPersistido = localStorage.getItem("foodflow-auth");
  if (!authPersistido) return null;

  try {
    const dados = JSON.parse(authPersistido) as { state?: { token?: string } };
    return dados.state?.token ?? null;
  } catch {
    return null;
  }
}

export async function buscarSaude() {
  const resposta = await fetch(`${API_URL}/health`);

  if (!resposta.ok) {
    throw new Error("Nao foi possivel consultar a API.");
  }

  return resposta.json() as Promise<{
    status: string;
    app: string;
    ambiente: string;
  }>;
}

export type PapelUsuario = "OWNER" | "MANAGER" | "CASHIER";

export type Usuario = {
  id: number;
  nome: string;
  email: string;
  papel: PapelUsuario;
  ativo: boolean;
  criado_em: string;
};

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export type CredenciaisLogin = {
  email: string;
  senha: string;
};

export type PrimeiroOwnerCriar = CredenciaisLogin & {
  nome: string;
};

export function criarPrimeiroOwner(corpo: PrimeiroOwnerCriar) {
  return requisitar<Usuario>("/auth/primeiro-owner", { metodo: "POST", corpo });
}

export function login(corpo: CredenciaisLogin) {
  return requisitar<TokenResponse>("/auth/login", { metodo: "POST", corpo });
}

export function buscarUsuarioAtual() {
  return requisitar<Usuario>("/auth/me");
}

export type StatusProduto = "RASCUNHO" | "ATIVO" | "INATIVO";

export type Produto = {
  id: number;
  nome: string;
  descricao: string | null;
  categoria_id: number;
  preco_venda: string;
  custo_ficha_tecnica: string;
  margem_estimada: string;
  demanda_esperada_diaria: number;
  status: StatusProduto;
  ficha_tecnica_valida: boolean;
  vendavel: boolean;
  motivo_indisponibilidade: string | null;
  criado_em: string;
  itens_ficha_tecnica: ItemFichaTecnica[];
};

export type ItemFichaTecnica = {
  id: number;
  produto_id: number;
  insumo_id: number;
  quantidade: string;
  unidade_medida_id: number;
  removivel: boolean;
  criado_em: string;
};

export type ProdutoCriar = {
  nome: string;
  descricao?: string;
  categoria_id: number;
  preco_venda: number;
  demanda_esperada_diaria: number;
  itens_ficha_tecnica: ItemFichaTecnicaCriar[];
};

export type ProdutoAtualizar = {
  nome?: string;
  descricao?: string;
  categoria_id?: number;
  preco_venda?: number;
  demanda_esperada_diaria?: number;
  itens_ficha_tecnica?: ItemFichaTecnicaCriar[];
};

export type ItemFichaTecnicaCriar = {
  insumo_id: number;
  quantidade: number;
  unidade_medida_id: number;
  removivel: boolean;
};

export type ItemFichaTecnicaAdicional = {
  id: number;
  adicional_id: number;
  insumo_id: number;
  quantidade: string;
  unidade_medida_id: number;
  criado_em: string;
};

export type Adicional = {
  id: number;
  nome: string;
  descricao: string | null;
  preco_extra: string;
  ativo: boolean;
  ficha_tecnica_valida: boolean;
  disponivel: boolean;
  motivo_indisponibilidade: string | null;
  categoria_ids: number[];
  criado_em: string;
  itens_ficha_tecnica: ItemFichaTecnicaAdicional[];
};

export type AdicionalCriar = {
  nome: string;
  descricao?: string;
  preco_extra: number;
  ativo: boolean;
  categoria_ids: number[];
  itens_ficha_tecnica: {
    insumo_id: number;
    quantidade: number;
    unidade_medida_id: number;
  }[];
};

export type RemocaoPermitida = {
  item_ficha_tecnica_id: number;
  insumo_id: number;
  nome_insumo: string;
  quantidade: string;
  unidade_medida_id: number;
};

export type VariacoesProduto = {
  produto_id: number;
  adicionais: Adicional[];
  remocoes_permitidas: RemocaoPermitida[];
  observacao_permitida: boolean;
};

export type SimulacaoItem = {
  produto_id: number;
  preco_base: string;
  preco_adicionais: string;
  preco_total: string;
  observacao: string | null;
  baixas_previstas: {
    insumo_id: number;
    nome_insumo: string;
    quantidade: string;
    estoque_atual: string;
    estoque_depois: string;
    suficiente: boolean;
  }[];
  estoque_suficiente: boolean;
};

export type FormaPagamento = "DINHEIRO" | "CARTAO_DEBITO" | "CARTAO_CREDITO" | "PIX" | "OUTRO";

export type ItemVendaCriar = {
  produto_id: number;
  quantidade: number;
  adicional_ids: number[];
  remocao_item_ficha_tecnica_ids: number[];
  observacao?: string;
};

export type VendaCriar = {
  itens: ItemVendaCriar[];
  forma_pagamento: FormaPagamento;
  observacao?: string;
};

export type ItemVenda = {
  id: number;
  venda_id: number;
  produto_id: number;
  nome_produto: string;
  quantidade: number;
  preco_unitario: string;
  desconto_total: string;
  preco_total: string;
  promocao_resumo: string | null;
  adicionais_resumo: string | null;
  remocoes_resumo: string | null;
  observacao: string | null;
};

export type Venda = {
  id: number;
  numero_pedido: string;
  usuario_id: number | null;
  forma_pagamento: FormaPagamento;
  status: "CONCLUIDA" | "CANCELADA";
  subtotal: string;
  desconto_total: string;
  total: string;
  promocoes_resumo: string | null;
  observacao: string | null;
  motivo_cancelamento: string | null;
  cancelado_por_id: number | null;
  cancelado_em: string | null;
  criado_em: string;
  itens: ItemVenda[];
};

export type TipoMovimentacaoEstoque =
  | "ENTRADA"
  | "SAIDA_VENDA"
  | "AJUSTE_MANUAL"
  | "PERDA_DESPERDICIO"
  | "DEVOLUCAO_CANCELAMENTO";

export type MovimentacaoEstoque = {
  id: number;
  insumo_id: number;
  usuario_id: number | null;
  venda_id: number | null;
  tipo: TipoMovimentacaoEstoque;
  quantidade: string;
  estoque_antes: string;
  estoque_depois: string;
  motivo: string | null;
  criado_em: string;
};

export type ConferenciaEstoque = {
  id: number;
  data: string;
  usuario_id: number | null;
  observacao: string | null;
  criado_em: string;
};

export type Dashboard = {
  inicio: string | null;
  fim: string | null;
  faturamento: string;
  descontos: string;
  vendas_concluidas: number;
  vendas_canceladas: number;
  ticket_medio: string;
  itens_vendidos: number;
  produtos_bloqueados: {
    id: number;
    nome: string;
    motivo: string;
  }[];
  alertas_estoque: {
    insumo_id: number;
    nome: string;
    quantidade_estoque: string;
    estoque_minimo: string;
  }[];
  produtos_mais_vendidos: {
    produto_id: number;
    nome: string;
    quantidade: number;
    total: string;
  }[];
};

export type EscopoPromocao = "PRODUTO" | "CATEGORIA" | "VENDA";
export type TipoDesconto = "PERCENTUAL" | "VALOR_FIXO";

export type Promocao = {
  id: number;
  nome: string;
  escopo: EscopoPromocao;
  tipo_desconto: TipoDesconto;
  valor: string;
  produto_id: number | null;
  categoria_id: number | null;
  inicio_em: string | null;
  fim_em: string | null;
  ativa: boolean;
  criado_em: string;
};

export type PromocaoCriar = {
  nome: string;
  escopo: EscopoPromocao;
  tipo_desconto: TipoDesconto;
  valor: number;
  produto_id?: number;
  categoria_id?: number;
  inicio_em?: string;
  fim_em?: string;
  ativa: boolean;
};

export type Categoria = {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  criado_em: string;
};

export type Insumo = {
  id: number;
  nome: string;
  unidade_medida_id: number;
  custo_unitario: string;
  quantidade_estoque: string;
  estoque_minimo: string;
  ativo: boolean;
  criado_em: string;
};

export type InsumoCriar = {
  nome: string;
  unidade_medida_id: number;
  custo_unitario: number;
  estoque_inicial: number;
  estoque_minimo: number;
};

export type InsumoAtualizar = {
  nome?: string;
  unidade_medida_id?: number;
  custo_unitario?: number;
  estoque_minimo?: number;
  ativo?: boolean;
};

export type UnidadeMedida = {
  id: number;
  nome: string;
  sigla: string;
  personalizada: boolean;
  ativa: boolean;
  criado_em: string;
};

export function listarCategorias() {
  return requisitar<Categoria[]>("/categorias");
}

export function listarInsumos() {
  return requisitar<Insumo[]>("/insumos");
}

export function cadastrarInsumo(corpo: InsumoCriar) {
  return requisitar<Insumo>("/insumos", { metodo: "POST", corpo });
}

export function atualizarInsumo(insumoId: number, corpo: InsumoAtualizar) {
  return requisitar<Insumo>(`/insumos/${insumoId}`, { metodo: "PUT", corpo });
}

export function listarUnidadesMedida() {
  return requisitar<UnidadeMedida[]>("/unidades-medida");
}

export function listarProdutos() {
  return requisitar<Produto[]>("/produtos");
}

export function consultarCardapioPDV() {
  return requisitar<{ categorias: Categoria[]; produtos: Produto[] }>("/pdv/cardapio");
}

export function cadastrarProduto(corpo: ProdutoCriar) {
  return requisitar<Produto>("/produtos", { metodo: "POST", corpo });
}

export function atualizarProduto(produtoId: number, corpo: ProdutoAtualizar) {
  return requisitar<Produto>(`/produtos/${produtoId}`, { metodo: "PUT", corpo });
}

export function salvarFichaTecnica(produtoId: number, itens: ItemFichaTecnicaCriar[]) {
  return requisitar<Produto>(`/produtos/${produtoId}/ficha-tecnica`, {
    metodo: "PUT",
    corpo: { itens },
  });
}

export function atualizarStatusProduto(produtoId: number, status: StatusProduto) {
  return requisitar<Produto>(`/produtos/${produtoId}/status`, {
    metodo: "PATCH",
    corpo: { status },
  });
}

export function recalcularProduto(produtoId: number) {
  return requisitar<Produto>(`/produtos/${produtoId}/recalcular`, { metodo: "POST" });
}

export function listarAdicionais() {
  return requisitar<Adicional[]>("/adicionais");
}

export function listarPromocoes() {
  return requisitar<Promocao[]>("/promocoes");
}

export function cadastrarPromocao(corpo: PromocaoCriar) {
  return requisitar<Promocao>("/promocoes", { metodo: "POST", corpo });
}

export function atualizarStatusPromocao(promocaoId: number, ativa: boolean) {
  return requisitar<Promocao>(`/promocoes/${promocaoId}/status`, {
    metodo: "PATCH",
    corpo: { ativa },
  });
}

export function cadastrarAdicional(corpo: AdicionalCriar) {
  return requisitar<Adicional>("/adicionais", { metodo: "POST", corpo });
}

export function listarVariacoesProduto(produtoId: number) {
  return requisitar<VariacoesProduto>(`/adicionais/produto/${produtoId}/variacoes`);
}

export function simularItemProduto(
  produtoId: number,
  corpo: {
    adicional_ids: number[];
    remocao_item_ficha_tecnica_ids: number[];
    observacao?: string;
  },
) {
  return requisitar<SimulacaoItem>(`/adicionais/produto/${produtoId}/simulacao-item`, {
    metodo: "POST",
    corpo,
  });
}

export function finalizarVenda(corpo: VendaCriar) {
  return requisitar<Venda>("/pdv/vendas", { metodo: "POST", corpo });
}

export function listarVendas() {
  return requisitar<Venda[]>("/pdv/vendas");
}

export function cancelarVenda(vendaId: number, motivo: string) {
  return requisitar<Venda>(`/pdv/vendas/${vendaId}/cancelar`, {
    metodo: "POST",
    corpo: { motivo },
  });
}

export function listarMovimentacoesEstoque() {
  return requisitar<MovimentacaoEstoque[]>("/estoque/movimentacoes");
}

export function registrarAjusteEstoque(corpo: {
  insumo_id: number;
  quantidade_diferenca: number;
  motivo: string;
}) {
  return requisitar<MovimentacaoEstoque>("/estoque/ajustes", { metodo: "POST", corpo });
}

export function registrarPerdaEstoque(corpo: {
  insumo_id: number;
  quantidade: number;
  motivo: string;
}) {
  return requisitar<MovimentacaoEstoque>("/estoque/perdas", { metodo: "POST", corpo });
}

export function confirmarConferenciaEstoque(corpo: { data?: string; observacao?: string }) {
  return requisitar<ConferenciaEstoque>("/estoque/conferencias-diarias", { metodo: "POST", corpo });
}

export function listarConferenciasEstoque() {
  return requisitar<ConferenciaEstoque[]>("/estoque/conferencias-diarias");
}

function montarQueryPeriodo(inicio?: string, fim?: string) {
  const params = new URLSearchParams();
  if (inicio) params.set("inicio", inicio);
  if (fim) params.set("fim", fim);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function buscarDashboard(inicio?: string, fim?: string) {
  return requisitar<Dashboard>(`/relatorios/dashboard${montarQueryPeriodo(inicio, fim)}`);
}

export function exportarDashboardCsv(inicio?: string, fim?: string) {
  return requisitarArquivo(`/relatorios/exportacoes/dashboard.csv${montarQueryPeriodo(inicio, fim)}`);
}

export function exportarDashboardPdf(inicio?: string, fim?: string) {
  return requisitarArquivo(`/relatorios/exportacoes/dashboard.pdf${montarQueryPeriodo(inicio, fim)}`);
}
export interface ItemRecomendacao {
  id: number;
  produto_id: number;
  quantidade_recomendada: number;
  demanda_considerada: number;
  lucro_unitario: string;
  produto_nome?: string;
}

export interface Recomendacao {
  id: number;
  fator_confianca: number;
  lucro_estimado: string;
  capacidade_usada: number;
  capacidade_total: number;
  periodo_recomendado: string;
  insumos_limitantes?: string;
  criado_em: string;
  usuario_nome?: string;
  itens: ItemRecomendacao[];
}

export interface BackupItem {
  nome_arquivo: string;
  tamanho_bytes: number;
  data_criacao: string;
}

export function listarRecomendacoes() {
  return requisitar<Recomendacao[]>("/recomendacoes/");
}

export function gerarRecomendacao() {
  return requisitar<Recomendacao>("/recomendacoes/gerar", {
    metodo: "POST",
    corpo: {
      capacidade_diaria: 150,
      dias_analise_demanda: 7,
      periodo_recomendado: "Hoje"
    }
  });
}

export function listarBackups() {
  return requisitar<BackupItem[]>("/backups/");
}

export function gerarBackup() {
  return requisitar<{ mensagem: string }>("/backups/gerar", {
    metodo: "POST"
  });
}
