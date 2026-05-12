const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

type MetodoHttp = "GET" | "POST" | "PUT" | "PATCH";

async function requisitar<T>(caminho: string, opcoes: { metodo?: MetodoHttp; corpo?: unknown } = {}) {
  const token = localStorage.getItem("foodflow_token");
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

export function listarUnidadesMedida() {
  return requisitar<UnidadeMedida[]>("/unidades-medida");
}

export function listarProdutos() {
  return requisitar<Produto[]>("/produtos");
}

export function cadastrarProduto(corpo: ProdutoCriar) {
  return requisitar<Produto>("/produtos", { metodo: "POST", corpo });
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
