import {
  Activity,
  BadgeCheck,
  BadgePercent,
  Boxes,
  Calculator,
  ClipboardCheck,
  CirclePlus,
  CreditCard,
  Download,
  ListChecks,
  LogIn,
  LogOut,
  MessageSquare,
  Minus,
  PackagePlus,
  Plus,
  RefreshCw,
  ReceiptText,
  ShieldPlus,
  ShoppingCart,
  Tags,
  Trash2,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  atualizarStatusProduto,
  atualizarStatusPromocao,
  Adicional,
  buscarDashboard,
  buscarUsuarioAtual,
  cadastrarAdicional,
  cadastrarPromocao,
  cadastrarProduto,
  cancelarVenda,
  Categoria,
  ConferenciaEstoque,
  confirmarConferenciaEstoque,
  consultarCardapioPDV,
  criarPrimeiroOwner,
  Dashboard,
  EscopoPromocao,
  exportarDashboardCsv,
  exportarDashboardPdf,
  finalizarVenda,
  FormaPagamento,
  Insumo,
  ItemFichaTecnicaCriar,
  listarAdicionais,
  listarCategorias,
  listarConferenciasEstoque,
  listarInsumos,
  listarMovimentacoesEstoque,
  listarProdutos,
  listarPromocoes,
  listarUnidadesMedida,
  listarVariacoesProduto,
  listarVendas,
  MovimentacaoEstoque,
  Produto,
  Promocao,
  registrarAjusteEstoque,
  registrarPerdaEstoque,
  TipoDesconto,
  recalcularProduto,
  salvarFichaTecnica,
  StatusProduto,
  UnidadeMedida,
  login,
  simularItemProduto,
  SimulacaoItem,
  Usuario,
  VariacoesProduto,
  Venda,
  Recomendacao,
  ItemRecomendacao,
  BackupItem,
  listarRecomendacoes,
  gerarRecomendacao,
  listarBackups,
  gerarBackup,
} from "../servicos/api";

type ItemCarrinho = {
  id: string;
  produto_id: number;
  nome_produto: string;
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
  adicional_ids: number[];
  remocao_item_ficha_tecnica_ids: number[];
  adicionais_resumo: string;
  remocoes_resumo: string;
  observacao: string;
};

export function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [verificandoSessao, setVerificandoSessao] = useState(true);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [cardapioProdutos, setCardapioProdutos] = useState<Produto[]>([]);
  const [cardapioCategorias, setCardapioCategorias] = useState<Categoria[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [unidades, setUnidades] = useState<UnidadeMedida[]>([]);
  const [adicionais, setAdicionais] = useState<Adicional[]>([]);
  const [promocoes, setPromocoes] = useState<Promocao[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [conferencias, setConferencias] = useState<ConferenciaEstoque[]>([]);
  const [recomendacoes, setRecomendacoes] = useState<Recomendacao[]>([]);
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [variacoes, setVariacoes] = useState<VariacoesProduto | null>(null);
  const [simulacao, setSimulacao] = useState<SimulacaoItem | null>(null);
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState<number | null>(null);
  const [aba, setAba] = useState<"pdv" | "gestao">("pdv");
  const [categoriaPdvId, setCategoriaPdvId] = useState<number | "todas">("todas");
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("PIX");
  const [vendaFinalizada, setVendaFinalizada] = useState<Venda | null>(null);
  const [mensagem, setMensagem] = useState("Informe um token JWT em localStorage.foodflow_token para operar a API protegida.");
  const [carregando, setCarregando] = useState(false);
  const [authModo, setAuthModo] = useState<"login" | "primeiro-owner">("login");
  const [authForm, setAuthForm] = useState({
    nome: "",
    email: "",
    senha: "",
  });
  const [produtoForm, setProdutoForm] = useState({
    nome: "",
    descricao: "",
    categoria_id: 1,
    preco_venda: 0,
    demanda_esperada_diaria: 0,
  });
  const [itemForm, setItemForm] = useState<ItemFichaTecnicaCriar>({
    insumo_id: 1,
    quantidade: 1,
    unidade_medida_id: 1,
    removivel: false,
  });
  const [adicionalForm, setAdicionalForm] = useState({
    nome: "",
    descricao: "",
    preco_extra: 0,
    categoria_id: 1,
    insumo_id: 1,
    quantidade: 1,
    unidade_medida_id: 1,
  });
  const [promocaoForm, setPromocaoForm] = useState({
    nome: "",
    escopo: "PRODUTO" as EscopoPromocao,
    tipo_desconto: "PERCENTUAL" as TipoDesconto,
    valor: 0,
    produto_id: 1,
    categoria_id: 1,
    inicio_em: "",
    fim_em: "",
  });
  const [cancelamentoForm, setCancelamentoForm] = useState({
    venda_id: 0,
    motivo: "",
  });
  const [ajusteForm, setAjusteForm] = useState({
    insumo_id: 1,
    quantidade_diferenca: 0,
    motivo: "",
  });
  const [perdaForm, setPerdaForm] = useState({
    insumo_id: 1,
    quantidade: 0,
    motivo: "",
  });
  const [conferenciaForm, setConferenciaForm] = useState({
    data: "",
    observacao: "",
  });
  const [dashboardFiltros, setDashboardFiltros] = useState({
    inicio: "",
    fim: "",
  });
  const [simulacaoForm, setSimulacaoForm] = useState({
    adicional_ids: [] as number[],
    remocao_item_ficha_tecnica_ids: [] as number[],
    observacao: "",
  });

  const produtoSelecionado = useMemo(
    () => produtos.find((produto) => produto.id === produtoSelecionadoId) ?? produtos[0],
    [produtoSelecionadoId, produtos],
  );
  const produtosPdvFiltrados = useMemo(
    () =>
      cardapioProdutos.filter(
        (produto) => categoriaPdvId === "todas" || produto.categoria_id === categoriaPdvId,
      ),
    [cardapioProdutos, categoriaPdvId],
  );
  const totalCarrinho = useMemo(
    () => carrinho.reduce((total, item) => total + item.preco_total, 0),
    [carrinho],
  );
  const podeCriarProduto = categorias.length > 0 && !carregando;
  const podeSalvarFicha = Boolean(produtoSelecionado) && insumos.length > 0 && unidades.length > 0 && !carregando;
  const podeCriarAdicional = categorias.length > 0 && insumos.length > 0 && unidades.length > 0 && !carregando;
  const podeCriarPromocao =
    !carregando &&
    ((promocaoForm.escopo === "PRODUTO" && produtos.length > 0) ||
      (promocaoForm.escopo === "CATEGORIA" && categorias.length > 0) ||
      promocaoForm.escopo === "VENDA");

  useEffect(() => {
    async function validarSessao() {
      const token = localStorage.getItem("foodflow_token");
      if (!token) {
        setVerificandoSessao(false);
        setMensagem("Entre para acessar o sistema.");
        return;
      }

      try {
        const usuarioAtual = await buscarUsuarioAtual();
        setUsuario(usuarioAtual);
        setMensagem(`Sessao ativa: ${usuarioAtual.nome}.`);
      } catch {
        localStorage.removeItem("foodflow_token");
        localStorage.removeItem("foodflow_refresh_token");
        setMensagem("Sessao expirada. Entre novamente.");
      } finally {
        setVerificandoSessao(false);
      }
    }

    void validarSessao();
  }, []);

  useEffect(() => {
    if (usuario) {
      void carregarDados();
    }
  }, [usuario]);

  useEffect(() => {
    if (usuario && produtoSelecionado) {
      void carregarVariacoes(produtoSelecionado.id);
    } else {
      setVariacoes(null);
      setSimulacao(null);
    }
  }, [usuario, produtoSelecionado?.id]);

  async function aoAutenticar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setCarregando(true);

    try {
      if (authModo === "primeiro-owner") {
        await criarPrimeiroOwner({
          nome: authForm.nome,
          email: authForm.email,
          senha: authForm.senha,
        });
      }

      const tokens = await login({ email: authForm.email, senha: authForm.senha });
      localStorage.setItem("foodflow_token", tokens.access_token);
      localStorage.setItem("foodflow_refresh_token", tokens.refresh_token);

      const usuarioAtual = await buscarUsuarioAtual();
      setUsuario(usuarioAtual);
      setAuthForm({ nome: "", email: "", senha: "" });
      setMensagem(`Bem-vindo, ${usuarioAtual.nome}.`);
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel entrar.");
    } finally {
      setCarregando(false);
    }
  }

  function sair() {
    localStorage.removeItem("foodflow_token");
    localStorage.removeItem("foodflow_refresh_token");
    setUsuario(null);
    setProdutos([]);
    setCategorias([]);
    setInsumos([]);
    setUnidades([]);
    setAdicionais([]);
    setPromocoes([]);
    setVendas([]);
    setMovimentacoes([]);
    setConferencias([]);
    setRecomendacoes([]);
    setBackups([]);
    setDashboard(null);
    setCardapioProdutos([]);
    setCardapioCategorias([]);
    setVariacoes(null);
    setSimulacao(null);
    setProdutoSelecionadoId(null);
    setCarrinho([]);
    setVendaFinalizada(null);
    setMensagem("Sessao encerrada.");
  }

  async function carregarDados() {
    setCarregando(true);
    try {
      const cardapio = await consultarCardapioPDV();
      setCardapioCategorias(cardapio.categorias);
      setCardapioProdutos(cardapio.produtos);
      setCategoriaPdvId((atual) => atual === "todas" || cardapio.categorias.some((categoria) => categoria.id === atual) ? atual : "todas");

      if (usuario?.papel === "CASHIER") {
        setProdutos(cardapio.produtos);
        setCategorias(cardapio.categorias);
        setProdutoSelecionadoId((atual) => atual ?? cardapio.produtos[0]?.id ?? null);
        setMensagem(cardapio.produtos.length ? "PDV pronto para venda." : "Nenhum produto ativo para o PDV.");
        return;
      }

      const [
        categoriasDados,
        insumosDados,
        unidadesDados,
        produtosDados,
        adicionaisDados,
        promocoesDados,
        vendasDados,
        movimentacoesDados,
        conferenciasDados,
        dashboardDados,
        recomendacoesDados,
        backupsDados,
      ] = await Promise.all([
        listarCategorias(),
        listarInsumos(),
        listarUnidadesMedida(),
        listarProdutos(),
        listarAdicionais(),
        listarPromocoes(),
        listarVendas(),
        listarMovimentacoesEstoque(),
        listarConferenciasEstoque(),
        buscarDashboard(dashboardFiltros.inicio || undefined, dashboardFiltros.fim || undefined),
        listarRecomendacoes(),
        listarBackups(),
      ]);

      setCategorias(categoriasDados);
      setInsumos(insumosDados);
      setUnidades(unidadesDados);
      setProdutos(produtosDados);
      setAdicionais(adicionaisDados);
      setPromocoes(promocoesDados);
      setVendas(vendasDados);
      setMovimentacoes(movimentacoesDados);
      setConferencias(conferenciasDados);
      setDashboard(dashboardDados);
      setRecomendacoes(recomendacoesDados);
      setBackups(backupsDados);
      setProdutoSelecionadoId((atual) => atual ?? cardapio.produtos[0]?.id ?? produtosDados[0]?.id ?? null);
      setProdutoForm((atual) => ({ ...atual, categoria_id: categoriasDados[0]?.id ?? 0 }));
      setItemForm((atual) => ({
        ...atual,
        insumo_id: insumosDados[0]?.id ?? 0,
        unidade_medida_id: unidadesDados[0]?.id ?? 0,
      }));
      setAdicionalForm((atual) => ({
        ...atual,
        categoria_id: categoriasDados[0]?.id ?? 0,
        insumo_id: insumosDados[0]?.id ?? 0,
        unidade_medida_id: unidadesDados[0]?.id ?? 0,
      }));
      setPromocaoForm((atual) => ({
        ...atual,
        produto_id: produtosDados[0]?.id ?? 0,
        categoria_id: categoriasDados[0]?.id ?? 0,
      }));
      setCancelamentoForm((atual) => ({ ...atual, venda_id: vendasDados[0]?.id ?? 0 }));
      setAjusteForm((atual) => ({ ...atual, insumo_id: insumosDados[0]?.id ?? 0 }));
      setPerdaForm((atual) => ({ ...atual, insumo_id: insumosDados[0]?.id ?? 0 }));

      if (!categoriasDados.length) {
        setMensagem("Cadastre uma categoria antes de criar produtos.");
      } else if (!insumosDados.length) {
        setMensagem("Cadastre insumos para montar a ficha tecnica dos produtos.");
      } else {
        setMensagem(produtosDados.length ? "Dados carregados." : "Nenhum produto cadastrado ainda.");
      }
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel carregar os dados.");
    } finally {
      setCarregando(false);
    }
  }

  async function carregarVariacoes(produtoId: number) {
    try {
      const variacoesDados = await listarVariacoesProduto(produtoId);
      setVariacoes(variacoesDados);
      setSimulacao(null);
      setSimulacaoForm({ adicional_ids: [], remocao_item_ficha_tecnica_ids: [], observacao: "" });
    } catch (erro) {
      setVariacoes(null);
      setSimulacao(null);
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel carregar variacoes do produto.");
    }
  }

  async function aoCadastrarProduto(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!categorias.length) {
      setMensagem("Cadastre uma categoria antes de criar produtos.");
      return;
    }

    setCarregando(true);
    try {
      const produto = await cadastrarProduto(produtoForm);
      setProdutos((atuais) => [...atuais, produto].sort((a, b) => a.nome.localeCompare(b.nome)));
      setProdutoSelecionadoId(produto.id);
      setProdutoForm({
        nome: "",
        descricao: "",
        categoria_id: categorias[0]?.id ?? 0,
        preco_venda: 0,
        demanda_esperada_diaria: 0,
      });
      setMensagem("Produto criado como rascunho.");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel cadastrar produto.");
    } finally {
      setCarregando(false);
    }
  }

  async function aoSalvarFicha(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!produtoSelecionado) return;
    if (!insumos.length || !unidades.length) {
      setMensagem("Cadastre insumos e unidades antes de montar a ficha tecnica.");
      return;
    }

    setCarregando(true);
    try {
      const produto = await salvarFichaTecnica(produtoSelecionado.id, [itemForm]);
      atualizarProdutoNaLista(produto);
      setMensagem("Ficha tecnica salva e custo recalculado.");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel salvar ficha tecnica.");
    } finally {
      setCarregando(false);
    }
  }

  async function aoCadastrarAdicional(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!categorias.length || !insumos.length || !unidades.length) {
      setMensagem("Cadastre categorias, insumos e unidades antes de criar adicionais.");
      return;
    }

    setCarregando(true);
    try {
      const adicional = await cadastrarAdicional({
        nome: adicionalForm.nome,
        descricao: adicionalForm.descricao,
        preco_extra: adicionalForm.preco_extra,
        ativo: true,
        categoria_ids: [adicionalForm.categoria_id],
        itens_ficha_tecnica: [
          {
            insumo_id: adicionalForm.insumo_id,
            quantidade: adicionalForm.quantidade,
            unidade_medida_id: adicionalForm.unidade_medida_id,
          },
        ],
      });

      setAdicionais((atuais) => [...atuais, adicional].sort((a, b) => a.nome.localeCompare(b.nome)));
      setAdicionalForm({
        nome: "",
        descricao: "",
        preco_extra: 0,
        categoria_id: categorias[0]?.id ?? 0,
        insumo_id: insumos[0]?.id ?? 0,
        quantidade: 1,
        unidade_medida_id: unidades[0]?.id ?? 0,
      });
      setMensagem("Adicional criado com categoria permitida e ficha tecnica.");
      if (produtoSelecionado) {
        await carregarVariacoes(produtoSelecionado.id);
      }
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel cadastrar adicional.");
    } finally {
      setCarregando(false);
    }
  }

  async function aoCadastrarPromocao(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!podeCriarPromocao) {
      setMensagem("Cadastre produtos ou categorias antes de criar esta promocao.");
      return;
    }

    setCarregando(true);
    try {
      const promocao = await cadastrarPromocao({
        nome: promocaoForm.nome,
        escopo: promocaoForm.escopo,
        tipo_desconto: promocaoForm.tipo_desconto,
        valor: promocaoForm.valor,
        ativa: true,
        produto_id: promocaoForm.escopo === "PRODUTO" ? promocaoForm.produto_id : undefined,
        categoria_id: promocaoForm.escopo === "CATEGORIA" ? promocaoForm.categoria_id : undefined,
        inicio_em: promocaoForm.inicio_em || undefined,
        fim_em: promocaoForm.fim_em || undefined,
      });

      setPromocoes((atuais) => [...atuais, promocao].sort((a, b) => a.nome.localeCompare(b.nome)));
      setPromocaoForm({
        nome: "",
        escopo: "PRODUTO",
        tipo_desconto: "PERCENTUAL",
        valor: 0,
        produto_id: produtos[0]?.id ?? 0,
        categoria_id: categorias[0]?.id ?? 0,
        inicio_em: "",
        fim_em: "",
      });
      setMensagem("Promocao criada. Ela sera aplicada automaticamente no PDV quando estiver vigente.");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel cadastrar promocao.");
    } finally {
      setCarregando(false);
    }
  }

  async function aoAlternarPromocao(promocao: Promocao) {
    setCarregando(true);
    try {
      const atualizada = await atualizarStatusPromocao(promocao.id, !promocao.ativa);
      setPromocoes((atuais) => atuais.map((item) => (item.id === atualizada.id ? atualizada : item)));
      setMensagem(`Promocao ${atualizada.ativa ? "ativada" : "inativada"}.`);
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel alterar a promocao.");
    } finally {
      setCarregando(false);
    }
  }

  async function aoCancelarVenda(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!cancelamentoForm.venda_id) {
      setMensagem("Selecione uma venda para cancelar.");
      return;
    }

    setCarregando(true);
    try {
      const venda = await cancelarVenda(cancelamentoForm.venda_id, cancelamentoForm.motivo);
      setCancelamentoForm({ venda_id: 0, motivo: "" });
      await carregarDados();
      setMensagem(`Venda ${venda.numero_pedido} cancelada e estoque devolvido.`);
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel cancelar a venda.");
    } finally {
      setCarregando(false);
    }
  }

  async function aoRegistrarAjuste(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setCarregando(true);
    try {
      await registrarAjusteEstoque(ajusteForm);
      setAjusteForm({ insumo_id: insumos[0]?.id ?? 0, quantidade_diferenca: 0, motivo: "" });
      await carregarDados();
      setMensagem("Ajuste manual registrado.");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel registrar ajuste.");
    } finally {
      setCarregando(false);
    }
  }

  async function aoRegistrarPerda(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setCarregando(true);
    try {
      await registrarPerdaEstoque(perdaForm);
      setPerdaForm({ insumo_id: insumos[0]?.id ?? 0, quantidade: 0, motivo: "" });
      await carregarDados();
      setMensagem("Perda ou desperdicio registrado.");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel registrar perda.");
    } finally {
      setCarregando(false);
    }
  }

  async function aoConfirmarConferencia(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setCarregando(true);
    try {
      const conferencia = await confirmarConferenciaEstoque({
        data: conferenciaForm.data || undefined,
        observacao: conferenciaForm.observacao || undefined,
      });
      setConferenciaForm({ data: "", observacao: "" });
      await carregarDados();
      setMensagem(`Estoque conferido em ${conferencia.data}.`);
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel confirmar conferencia.");
    } finally {
      setCarregando(false);
    }
  }

  async function aoAplicarFiltrosDashboard(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setCarregando(true);
    try {
      const dados = await buscarDashboard(dashboardFiltros.inicio || undefined, dashboardFiltros.fim || undefined);
      setDashboard(dados);
      setMensagem("Dashboard atualizado.");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel atualizar o dashboard.");
    } finally {
      setCarregando(false);
    }
  }

  async function aoExportarDashboard(tipo: "csv" | "pdf") {
    setCarregando(true);
    try {
      const blob =
        tipo === "csv"
          ? await exportarDashboardCsv(dashboardFiltros.inicio || undefined, dashboardFiltros.fim || undefined)
          : await exportarDashboardPdf(dashboardFiltros.inicio || undefined, dashboardFiltros.fim || undefined);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `foodflow-dashboard.${tipo}`;
      link.click();
      URL.revokeObjectURL(url);
      setMensagem(`Exportacao ${tipo.toUpperCase()} gerada.`);
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel exportar.");
    } finally {
      setCarregando(false);
    }
  }

  async function aoSimularItem(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!produtoSelecionado) return;

    setCarregando(true);
    try {
      const resultado = await simularItemProduto(produtoSelecionado.id, {
        adicional_ids: simulacaoForm.adicional_ids,
        remocao_item_ficha_tecnica_ids: simulacaoForm.remocao_item_ficha_tecnica_ids,
        observacao: simulacaoForm.observacao || undefined,
      });
      setSimulacao(resultado);
      setMensagem("Variacoes simuladas sem alterar o estoque.");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel simular o item.");
    } finally {
      setCarregando(false);
    }
  }

  async function aoMudarStatus(status: StatusProduto) {
    if (!produtoSelecionado) return;

    setCarregando(true);
    try {
      const produto = await atualizarStatusProduto(produtoSelecionado.id, status);
      atualizarProdutoNaLista(produto);
      setMensagem(`Produto marcado como ${status.toLowerCase()}.`);
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel alterar status.");
    } finally {
      setCarregando(false);
    }
  }

  async function aoRecalcular() {
    if (!produtoSelecionado) return;

    setCarregando(true);
    try {
      const produto = await recalcularProduto(produtoSelecionado.id);
      atualizarProdutoNaLista(produto);
      setMensagem("Custo e margem recalculados com o custo atual dos insumos.");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel recalcular.");
    } finally {
      setCarregando(false);
    }
  }

  function atualizarProdutoNaLista(produtoAtualizado: Produto) {
    setProdutos((atuais) =>
      atuais.map((produto) => (produto.id === produtoAtualizado.id ? produtoAtualizado : produto)),
    );
  }

  function alternarId(campo: "adicional_ids" | "remocao_item_ficha_tecnica_ids", id: number) {
    setSimulacaoForm((atual) => {
      const existe = atual[campo].includes(id);
      return {
        ...atual,
        [campo]: existe ? atual[campo].filter((item) => item !== id) : [...atual[campo], id],
      };
    });
  }

  async function aoAdicionarItemCarrinho() {
    if (!produtoSelecionado || !produtoSelecionado.vendavel) return;

    setCarregando(true);
    try {
      const resultado = await simularItemProduto(produtoSelecionado.id, {
        adicional_ids: simulacaoForm.adicional_ids,
        remocao_item_ficha_tecnica_ids: simulacaoForm.remocao_item_ficha_tecnica_ids,
        observacao: simulacaoForm.observacao || undefined,
      });
      const adicionaisResumo =
        variacoes?.adicionais
          .filter((adicional) => simulacaoForm.adicional_ids.includes(adicional.id))
          .map((adicional) => adicional.nome)
          .join(", ") ?? "";
      const remocoesResumo =
        variacoes?.remocoes_permitidas
          .filter((remocao) => simulacaoForm.remocao_item_ficha_tecnica_ids.includes(remocao.item_ficha_tecnica_id))
          .map((remocao) => remocao.nome_insumo)
          .join(", ") ?? "";

      setCarrinho((atual) => [
        ...atual,
        {
          id: `${produtoSelecionado.id}-${Date.now()}`,
          produto_id: produtoSelecionado.id,
          nome_produto: produtoSelecionado.nome,
          quantidade: 1,
          preco_unitario: Number(resultado.preco_total),
          preco_total: Number(resultado.preco_total),
          adicional_ids: [...simulacaoForm.adicional_ids],
          remocao_item_ficha_tecnica_ids: [...simulacaoForm.remocao_item_ficha_tecnica_ids],
          adicionais_resumo: adicionaisResumo,
          remocoes_resumo: remocoesResumo,
          observacao: simulacaoForm.observacao,
        },
      ]);
      setSimulacao(resultado);
      setVendaFinalizada(null);
      setMensagem("Item adicionado ao carrinho.");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel adicionar o item.");
    } finally {
      setCarregando(false);
    }
  }

  function alterarQuantidadeCarrinho(itemId: string, delta: number) {
    setCarrinho((atual) =>
      atuaisComQuantidadeValida(
        atual.map((item) =>
          item.id === itemId
            ? {
                ...item,
                quantidade: item.quantidade + delta,
                preco_total: item.preco_unitario * (item.quantidade + delta),
              }
            : item,
        ),
      ),
    );
  }

  function removerItemCarrinho(itemId: string) {
    setCarrinho((atual) => atual.filter((item) => item.id !== itemId));
  }

  async function aoFinalizarVenda() {
    if (!carrinho.length) {
      setMensagem("Adicione itens ao carrinho antes de finalizar.");
      return;
    }

    setCarregando(true);
    try {
      const venda = await finalizarVenda({
        forma_pagamento: formaPagamento,
        itens: carrinho.map((item) => ({
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          adicional_ids: item.adicional_ids,
          remocao_item_ficha_tecnica_ids: item.remocao_item_ficha_tecnica_ids,
          observacao: item.observacao || undefined,
        })),
      });
      setVendaFinalizada(venda);
      setCarrinho([]);
      await carregarDados();
      setMensagem(`Venda ${venda.numero_pedido} finalizada.`);
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel finalizar a venda.");
    } finally {
      setCarregando(false);
    }
  }

  async function aoGerarRecomendacao() {
    setCarregando(true);
    try {
      const dados = await gerarRecomendacao();
      setRecomendacoes([dados, ...recomendacoes]);
      setMensagem("Recomendacao gerada com sucesso!");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel gerar a recomendacao.");
    } finally {
      setCarregando(false);
    }
  }

  async function aoGerarBackup() {
    setCarregando(true);
    try {
      const resposta = await gerarBackup();
      setMensagem(resposta.mensagem);
      const atualizados = await listarBackups();
      setBackups(atualizados);
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel gerar o backup.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">FoodFlow Gestao</p>
          <h1>PDV e operacao de venda</h1>
        </div>
        {usuario ? (
          <div className="user-area">
            <span className="status">
              <Activity size={18} aria-hidden="true" />
              {usuario.papel}
            </span>
            <button className="icon-button" type="button" onClick={sair} title="Sair">
              <LogOut size={18} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <span className="status">
            <Activity size={18} aria-hidden="true" />
            Acesso restrito
          </span>
        )}
      </section>

      {verificandoSessao ? (
        <section className="auth-shell">
          <p className="empty">Verificando sessao...</p>
        </section>
      ) : !usuario ? (
        <section className="auth-shell">
          <div className="auth-tabs" role="tablist" aria-label="Autenticacao">
            <button
              className={authModo === "login" ? "selected" : ""}
              type="button"
              onClick={() => setAuthModo("login")}
            >
              <LogIn size={18} aria-hidden="true" />
              Entrar
            </button>
            <button
              className={authModo === "primeiro-owner" ? "selected" : ""}
              type="button"
              onClick={() => setAuthModo("primeiro-owner")}
            >
              <ShieldPlus size={18} aria-hidden="true" />
              Primeiro acesso
            </button>
          </div>

          <form className="auth-card" onSubmit={aoAutenticar}>
            <h2>{authModo === "login" ? "Entrar no FoodFlow" : "Criar primeiro OWNER"}</h2>
            {authModo === "primeiro-owner" ? (
              <label>
                Nome
                <input
                  value={authForm.nome}
                  onChange={(evento) => setAuthForm({ ...authForm, nome: evento.target.value })}
                />
              </label>
            ) : null}
            <label>
              Email
              <input
                type="email"
                value={authForm.email}
                onChange={(evento) => setAuthForm({ ...authForm, email: evento.target.value })}
              />
            </label>
            <label>
              Senha
              <input
                minLength={8}
                type="password"
                value={authForm.senha}
                onChange={(evento) => setAuthForm({ ...authForm, senha: evento.target.value })}
              />
            </label>
            <button type="submit" disabled={carregando}>
              {authModo === "login" ? "Entrar" : "Criar e entrar"}
            </button>
          </form>
        </section>
      ) : (
        <>
        <div className="mode-tabs" role="tablist" aria-label="Areas do sistema">
          <button className={aba === "pdv" ? "selected" : ""} type="button" onClick={() => setAba("pdv")}>
            <ShoppingCart size={18} aria-hidden="true" />
            PDV
          </button>
          {usuario.papel !== "CASHIER" ? (
            <button className={aba === "gestao" ? "selected" : ""} type="button" onClick={() => setAba("gestao")}>
              <Boxes size={18} aria-hidden="true" />
              Gestao
            </button>
          ) : null}
        </div>

        {aba === "pdv" ? (
          <section className="pdv-layout">
            <section className="panel catalog-panel">
              <div className="panel-title">
                <ShoppingCart size={20} aria-hidden="true" />
                <h2>Cardapio</h2>
                <button className="icon-button" type="button" onClick={carregarDados} disabled={carregando} title="Atualizar">
                  <RefreshCw size={18} aria-hidden="true" />
                </button>
              </div>

              <div className="category-tabs">
                <button
                  className={categoriaPdvId === "todas" ? "selected" : ""}
                  type="button"
                  onClick={() => setCategoriaPdvId("todas")}
                >
                  Todas
                </button>
                {cardapioCategorias.map((categoria) => (
                  <button
                    className={categoriaPdvId === categoria.id ? "selected" : ""}
                    key={categoria.id}
                    type="button"
                    onClick={() => setCategoriaPdvId(categoria.id)}
                  >
                    {categoria.nome}
                  </button>
                ))}
              </div>

              <div className="product-grid">
                {produtosPdvFiltrados.map((produto) => (
                  <button
                    className={`product-tile ${produtoSelecionado?.id === produto.id ? "selected" : ""}`}
                    disabled={!produto.vendavel}
                    key={produto.id}
                    type="button"
                    onClick={() => setProdutoSelecionadoId(produto.id)}
                    title={produto.motivo_indisponibilidade ?? produto.nome}
                  >
                    <strong>{produto.nome}</strong>
                    <span>{formatarMoeda(produto.preco_venda)}</span>
                    <small>{produto.vendavel ? nomeCategoria(produto.categoria_id, cardapioCategorias) : produto.motivo_indisponibilidade}</small>
                  </button>
                ))}
                {!produtosPdvFiltrados.length ? <p className="empty">Nenhum produto ativo nesta categoria.</p> : null}
              </div>
            </section>

            <section className="panel options-panel">
              <div className="panel-title">
                <ListChecks size={20} aria-hidden="true" />
                <h2>Item</h2>
              </div>

              {produtoSelecionado ? (
                <div className="stack">
                  <div className={`availability ${produtoSelecionado.vendavel ? "ok" : "blocked"}`}>
                    <BadgeCheck size={18} aria-hidden="true" />
                    <span>{produtoSelecionado.vendavel ? produtoSelecionado.nome : produtoSelecionado.motivo_indisponibilidade}</span>
                  </div>

                  <form className="variation-grid" onSubmit={aoSimularItem}>
                    <div>
                      <h3>Adicionais</h3>
                      <div className="stack">
                        {variacoes?.adicionais.map((adicional) => (
                          <label className="option-row" key={adicional.id}>
                            <input
                              type="checkbox"
                              checked={simulacaoForm.adicional_ids.includes(adicional.id)}
                              onChange={() => alternarId("adicional_ids", adicional.id)}
                            />
                            <span>
                              {adicional.nome}
                              <small>{formatarMoeda(adicional.preco_extra)}</small>
                            </span>
                          </label>
                        ))}
                        {!variacoes?.adicionais.length ? <p className="empty">Sem adicionais para este produto.</p> : null}
                      </div>
                    </div>

                    <div>
                      <h3>Remocoes</h3>
                      <div className="stack">
                        {variacoes?.remocoes_permitidas.map((remocao) => (
                          <label className="option-row" key={remocao.item_ficha_tecnica_id}>
                            <input
                              type="checkbox"
                              checked={simulacaoForm.remocao_item_ficha_tecnica_ids.includes(remocao.item_ficha_tecnica_id)}
                              onChange={() => alternarId("remocao_item_ficha_tecnica_ids", remocao.item_ficha_tecnica_id)}
                            />
                            <span>{remocao.nome_insumo}</span>
                          </label>
                        ))}
                        {!variacoes?.remocoes_permitidas.length ? <p className="empty">Sem remocoes para este produto.</p> : null}
                      </div>
                    </div>

                    <label className="wide">
                      <MessageSquare size={18} aria-hidden="true" />
                      Observacao
                      <textarea
                        maxLength={255}
                        value={simulacaoForm.observacao}
                        onChange={(evento) => setSimulacaoForm({ ...simulacaoForm, observacao: evento.target.value })}
                      />
                    </label>

                    <button type="submit" disabled={carregando || !produtoSelecionado.vendavel}>
                      Simular
                    </button>
                    <button type="button" disabled={carregando || !produtoSelecionado.vendavel} onClick={aoAdicionarItemCarrinho}>
                      Adicionar
                    </button>
                  </form>

                  {simulacao ? (
                    <div className="simulation-result">
                      <Metric label="Item" value={formatarMoeda(simulacao.preco_total)} />
                      <Metric label="Adicionais" value={formatarMoeda(simulacao.preco_adicionais)} />
                      <Metric label="Estoque" value={simulacao.estoque_suficiente ? "Suficiente" : "Insuficiente"} />
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="empty">Selecione um produto vendavel.</p>
              )}
            </section>

            <aside className="panel cart-panel">
              <div className="panel-title">
                <ReceiptText size={20} aria-hidden="true" />
                <h2>Carrinho</h2>
              </div>

              <div className="stack">
                {carrinho.map((item) => (
                  <div className="cart-row" key={item.id}>
                    <div>
                      <strong>{item.nome_produto}</strong>
                      <small>
                        {item.adicionais_resumo || "Sem adicional"}
                        {item.remocoes_resumo ? ` - sem ${item.remocoes_resumo}` : ""}
                      </small>
                    </div>
                    <div className="quantity-control">
                      <button className="icon-button" type="button" onClick={() => alterarQuantidadeCarrinho(item.id, -1)} title="Diminuir">
                        <Minus size={16} aria-hidden="true" />
                      </button>
                      <span>{item.quantidade}</span>
                      <button className="icon-button" type="button" onClick={() => alterarQuantidadeCarrinho(item.id, 1)} title="Aumentar">
                        <Plus size={16} aria-hidden="true" />
                      </button>
                    </div>
                    <strong>{formatarMoeda(String(item.preco_total))}</strong>
                    <button className="icon-button" type="button" onClick={() => removerItemCarrinho(item.id)} title="Remover">
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                ))}
                {!carrinho.length ? <p className="empty">Carrinho vazio.</p> : null}
              </div>

              <div className="checkout-box">
                <Metric label="Total" value={formatarMoeda(String(totalCarrinho))} />
                <label>
                  Pagamento
                  <select value={formaPagamento} onChange={(evento) => setFormaPagamento(evento.target.value as FormaPagamento)}>
                    <option value="PIX">PIX</option>
                    <option value="DINHEIRO">Dinheiro</option>
                    <option value="CARTAO_DEBITO">Cartao de debito</option>
                    <option value="CARTAO_CREDITO">Cartao de credito</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </label>
                <button type="button" onClick={aoFinalizarVenda} disabled={carregando || !carrinho.length}>
                  <CreditCard size={18} aria-hidden="true" />
                  Finalizar venda
                </button>
                {vendaFinalizada ? (
                  <div className="sale-summary">
                    <p className="form-note">Pedido {vendaFinalizada.numero_pedido} concluido.</p>
                    <small>
                      Subtotal {formatarMoeda(vendaFinalizada.subtotal)} - desconto {formatarMoeda(vendaFinalizada.desconto_total)} - total {formatarMoeda(vendaFinalizada.total)}
                    </small>
                    {vendaFinalizada.promocoes_resumo ? <small>{vendaFinalizada.promocoes_resumo}</small> : null}
                  </div>
                ) : null}
              </div>
            </aside>
          </section>
        ) : (
        <section className="workspace">
        <nav className="module-nav wide-panel" aria-label="Modulos de gestao">
          <a href="#dashboard">Dashboard</a>
          <a href="#produtos">Produtos</a>
          <a href="#ficha">Ficha tecnica</a>
          <a href="#adicionais">Adicionais</a>
          <a href="#promocoes">Promocoes</a>
          <a href="#estoque">Estoque</a>
          <a href="#variacoes">Variacoes</a>
          <a href="#recomendacoes">Recomendacoes</a>
          <a href="#backups">Backups</a>
        </nav>

        <section className="panel wide-panel" id="dashboard">
          <div className="panel-title">
            <Activity size={20} aria-hidden="true" />
            <h2>Dashboard</h2>
            <button className="icon-button" type="button" onClick={carregarDados} disabled={carregando} title="Atualizar">
              <RefreshCw size={18} aria-hidden="true" />
            </button>
          </div>

          <form className="dashboard-filters" onSubmit={aoAplicarFiltrosDashboard}>
            <label>
              Inicio
              <input
                type="date"
                value={dashboardFiltros.inicio}
                onChange={(evento) => setDashboardFiltros({ ...dashboardFiltros, inicio: evento.target.value })}
              />
            </label>
            <label>
              Fim
              <input
                type="date"
                value={dashboardFiltros.fim}
                onChange={(evento) => setDashboardFiltros({ ...dashboardFiltros, fim: evento.target.value })}
              />
            </label>
            <button type="submit" disabled={carregando}>
              Filtrar
            </button>
            <button type="button" disabled={carregando} onClick={() => aoExportarDashboard("csv")}>
              <Download size={18} aria-hidden="true" />
              CSV
            </button>
            <button type="button" disabled={carregando} onClick={() => aoExportarDashboard("pdf")}>
              <Download size={18} aria-hidden="true" />
              PDF
            </button>
          </form>

          {dashboard ? (
            <>
              <div className="status-grid dashboard-metrics">
                <Metric label="Faturamento" value={formatarMoeda(dashboard.faturamento)} />
                <Metric label="Ticket medio" value={formatarMoeda(dashboard.ticket_medio)} />
                <Metric label="Vendas" value={String(dashboard.vendas_concluidas)} />
                <Metric label="Canceladas" value={String(dashboard.vendas_canceladas)} />
              </div>

              <div className="dashboard-grid">
                <div>
                  <h3>Mais vendidos</h3>
                  <div className="stack">
                    {dashboard.produtos_mais_vendidos.map((produto) => (
                      <div className="data-row" key={produto.produto_id}>
                        <div>
                          <strong>{produto.nome}</strong>
                          <small>{produto.quantidade} itens - {formatarMoeda(produto.total)}</small>
                        </div>
                      </div>
                    ))}
                    {!dashboard.produtos_mais_vendidos.length ? <p className="empty">Sem vendas concluidas no periodo.</p> : null}
                  </div>
                </div>

                <div>
                  <h3>Produtos bloqueados</h3>
                  <div className="stack">
                    {dashboard.produtos_bloqueados.map((produto) => (
                      <div className="data-row" key={produto.id}>
                        <div>
                          <strong>{produto.nome}</strong>
                          <small>{produto.motivo}</small>
                        </div>
                      </div>
                    ))}
                    {!dashboard.produtos_bloqueados.length ? <p className="empty">Nenhum produto bloqueado.</p> : null}
                  </div>
                </div>

                <div>
                  <h3>Alertas de estoque</h3>
                  <div className="stack">
                    {dashboard.alertas_estoque.map((alerta) => (
                      <div className="data-row" key={alerta.insumo_id}>
                        <div>
                          <strong>{alerta.nome}</strong>
                          <small>
                            {formatarQuantidade(alerta.quantidade_estoque)} em estoque - minimo {formatarQuantidade(alerta.estoque_minimo)}
                          </small>
                        </div>
                      </div>
                    ))}
                    {!dashboard.alertas_estoque.length ? <p className="empty">Nenhum alerta de estoque.</p> : null}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="empty">Carregando indicadores.</p>
          )}
        </section>

        <aside className="panel product-list" id="produtos" aria-label="Produtos cadastrados">
          <div className="panel-title">
            <Boxes size={20} aria-hidden="true" />
            <h2>Produtos</h2>
            <button className="icon-button" type="button" onClick={carregarDados} disabled={carregando} title="Atualizar">
              <RefreshCw size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="stack">
            {produtos.map((produto) => (
              <button
                className={`product-row ${produtoSelecionado?.id === produto.id ? "selected" : ""}`}
                key={produto.id}
                type="button"
                onClick={() => setProdutoSelecionadoId(produto.id)}
              >
                <span>{produto.nome}</span>
                <small>{produto.status}</small>
              </button>
            ))}
          </div>
        </aside>

        <section className="panel detail-panel">
          <div className="panel-title">
            <ShoppingCart size={20} aria-hidden="true" />
            <h2>Disponibilidade no PDV</h2>
          </div>

          {produtoSelecionado ? (
            <>
              <div className="status-grid">
                <Metric label="Preco" value={formatarMoeda(produtoSelecionado.preco_venda)} />
                <Metric label="Custo" value={formatarMoeda(produtoSelecionado.custo_ficha_tecnica)} />
                <Metric label="Margem" value={formatarMoeda(produtoSelecionado.margem_estimada)} />
                <Metric label="Ficha" value={produtoSelecionado.ficha_tecnica_valida ? "Valida" : "Incompleta"} />
              </div>

              <div className={`availability ${produtoSelecionado.vendavel ? "ok" : "blocked"}`}>
                <BadgeCheck size={18} aria-hidden="true" />
                <span>
                  {produtoSelecionado.vendavel
                    ? "Produto vendavel no PDV"
                    : produtoSelecionado.motivo_indisponibilidade}
                </span>
              </div>

              <div className="actions">
                <button type="button" onClick={() => aoMudarStatus("ATIVO")} disabled={carregando}>
                  Ativar
                </button>
                <button type="button" onClick={() => aoMudarStatus("INATIVO")} disabled={carregando}>
                  Inativar
                </button>
                <button type="button" onClick={() => aoMudarStatus("RASCUNHO")} disabled={carregando}>
                  Rascunho
                </button>
                <button type="button" onClick={aoRecalcular} disabled={carregando}>
                  Recalcular
                </button>
              </div>
            </>
          ) : (
            <p className="empty">Cadastre um produto para comecar.</p>
          )}
        </section>

        <section className="panel form-panel" id="novo-produto">
          <div className="panel-title">
            <PackagePlus size={20} aria-hidden="true" />
            <h2>Novo produto</h2>
          </div>

          <form className="form-grid" onSubmit={aoCadastrarProduto}>
            <label>
              Nome
              <input value={produtoForm.nome} onChange={(evento) => setProdutoForm({ ...produtoForm, nome: evento.target.value })} />
            </label>
            <label>
              Categoria
              <select
                value={produtoForm.categoria_id}
                onChange={(evento) => setProdutoForm({ ...produtoForm, categoria_id: Number(evento.target.value) })}
                disabled={!categorias.length}
              >
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Preco de venda
              <input
                inputMode="decimal"
                type="text"
                value={produtoForm.preco_venda}
                onFocus={(evento) => evento.target.select()}
                onChange={(evento) => setProdutoForm({ ...produtoForm, preco_venda: Number(evento.target.value) })}
              />
            </label>
            <label>
              Demanda diaria
              <input
                inputMode="numeric"
                type="text"
                value={produtoForm.demanda_esperada_diaria}
                onFocus={(evento) => evento.target.select()}
                onChange={(evento) =>
                  setProdutoForm({ ...produtoForm, demanda_esperada_diaria: Number(evento.target.value) })
                }
              />
            </label>
            <label className="wide">
              Descricao
              <textarea
                value={produtoForm.descricao}
                onChange={(evento) => setProdutoForm({ ...produtoForm, descricao: evento.target.value })}
              />
            </label>
            {!categorias.length ? <p className="form-note wide">Nenhuma categoria cadastrada.</p> : null}
            <button type="submit" disabled={!podeCriarProduto}>
              Criar rascunho
            </button>
          </form>
        </section>

        <section className="panel form-panel" id="ficha">
          <div className="panel-title">
            <Calculator size={20} aria-hidden="true" />
            <h2>Ficha tecnica</h2>
          </div>

          <form className="form-grid" onSubmit={aoSalvarFicha}>
            <label>
              Insumo
              <select
                value={itemForm.insumo_id}
                onChange={(evento) => setItemForm({ ...itemForm, insumo_id: Number(evento.target.value) })}
                disabled={!insumos.length}
              >
                {insumos.map((insumo) => (
                  <option key={insumo.id} value={insumo.id}>
                    {insumo.nome}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Quantidade
              <input
                inputMode="decimal"
                type="text"
                value={itemForm.quantidade}
                onFocus={(evento) => evento.target.select()}
                onChange={(evento) => setItemForm({ ...itemForm, quantidade: Number(evento.target.value) })}
              />
            </label>
            <label>
              Unidade
              <select
                value={itemForm.unidade_medida_id}
                onChange={(evento) => setItemForm({ ...itemForm, unidade_medida_id: Number(evento.target.value) })}
                disabled={!unidades.length}
              >
                {unidades.map((unidade) => (
                  <option key={unidade.id} value={unidade.id}>
                    {unidade.nome} ({unidade.sigla})
                  </option>
                ))}
              </select>
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={itemForm.removivel}
                onChange={(evento) => setItemForm({ ...itemForm, removivel: evento.target.checked })}
              />
              Removivel no PDV
            </label>
            {!insumos.length ? <p className="form-note wide">Nenhum insumo cadastrado.</p> : null}
            {!unidades.length ? <p className="form-note wide">Nenhuma unidade cadastrada.</p> : null}
            <button type="submit" disabled={!podeSalvarFicha}>
              Salvar ficha
            </button>
          </form>
        </section>

        <section className="panel form-panel" id="adicionais">
          <div className="panel-title">
            <CirclePlus size={20} aria-hidden="true" />
            <h2>Novo adicional</h2>
          </div>

          <form className="form-grid" onSubmit={aoCadastrarAdicional}>
            <label>
              Nome
              <input
                value={adicionalForm.nome}
                onChange={(evento) => setAdicionalForm({ ...adicionalForm, nome: evento.target.value })}
              />
            </label>
            <label>
              Categoria permitida
              <select
                value={adicionalForm.categoria_id}
                onChange={(evento) => setAdicionalForm({ ...adicionalForm, categoria_id: Number(evento.target.value) })}
                disabled={!categorias.length}
              >
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Preco extra
              <input
                inputMode="decimal"
                type="text"
                value={adicionalForm.preco_extra}
                onFocus={(evento) => evento.target.select()}
                onChange={(evento) => setAdicionalForm({ ...adicionalForm, preco_extra: Number(evento.target.value) })}
              />
            </label>
            <label>
              Insumo da ficha
              <select
                value={adicionalForm.insumo_id}
                onChange={(evento) => setAdicionalForm({ ...adicionalForm, insumo_id: Number(evento.target.value) })}
                disabled={!insumos.length}
              >
                {insumos.map((insumo) => (
                  <option key={insumo.id} value={insumo.id}>
                    {insumo.nome}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Quantidade
              <input
                inputMode="decimal"
                type="text"
                value={adicionalForm.quantidade}
                onFocus={(evento) => evento.target.select()}
                onChange={(evento) => setAdicionalForm({ ...adicionalForm, quantidade: Number(evento.target.value) })}
              />
            </label>
            <label>
              Unidade
              <select
                value={adicionalForm.unidade_medida_id}
                onChange={(evento) =>
                  setAdicionalForm({ ...adicionalForm, unidade_medida_id: Number(evento.target.value) })
                }
                disabled={!unidades.length}
              >
                {unidades.map((unidade) => (
                  <option key={unidade.id} value={unidade.id}>
                    {unidade.nome} ({unidade.sigla})
                  </option>
                ))}
              </select>
            </label>
            <label className="wide">
              Descricao
              <textarea
                value={adicionalForm.descricao}
                onChange={(evento) => setAdicionalForm({ ...adicionalForm, descricao: evento.target.value })}
              />
            </label>
            <button type="submit" disabled={!podeCriarAdicional}>
              Criar adicional
            </button>
          </form>
        </section>

        <section className="panel detail-panel" id="adicionais-lista">
          <div className="panel-title">
            <Tags size={20} aria-hidden="true" />
            <h2>Adicionais cadastrados</h2>
          </div>

          <div className="stack">
            {adicionais.map((adicional) => (
              <div className="data-row" key={adicional.id}>
                <div>
                  <strong>{adicional.nome}</strong>
                  <small>
                    {formatarMoeda(adicional.preco_extra)} - {adicional.categoria_ids.map((id) => nomeCategoria(id, categorias)).join(", ")}
                  </small>
                </div>
                <span className={`mini-status ${adicional.disponivel ? "ok" : "blocked"}`}>
                  {adicional.disponivel ? "Disponivel" : "Bloqueado"}
                </span>
              </div>
            ))}
            {!adicionais.length ? <p className="empty">Nenhum adicional cadastrado ainda.</p> : null}
          </div>
        </section>

        <section className="panel form-panel wide-panel" id="promocoes">
          <div className="panel-title">
            <BadgePercent size={20} aria-hidden="true" />
            <h2>Promocoes</h2>
          </div>

          <form className="form-grid" onSubmit={aoCadastrarPromocao}>
            <label>
              Nome
              <input
                value={promocaoForm.nome}
                onChange={(evento) => setPromocaoForm({ ...promocaoForm, nome: evento.target.value })}
              />
            </label>
            <label>
              Escopo
              <select
                value={promocaoForm.escopo}
                onChange={(evento) =>
                  setPromocaoForm({ ...promocaoForm, escopo: evento.target.value as typeof promocaoForm.escopo })
                }
              >
                <option value="PRODUTO">Produto</option>
                <option value="CATEGORIA">Categoria</option>
                <option value="VENDA">Venda inteira</option>
              </select>
            </label>
            <label>
              Tipo
              <select
                value={promocaoForm.tipo_desconto}
                onChange={(evento) =>
                  setPromocaoForm({
                    ...promocaoForm,
                    tipo_desconto: evento.target.value as typeof promocaoForm.tipo_desconto,
                  })
                }
              >
                <option value="PERCENTUAL">Percentual</option>
                <option value="VALOR_FIXO">Valor fixo</option>
              </select>
            </label>
            <label>
              Valor
              <input
                inputMode="decimal"
                type="text"
                value={promocaoForm.valor}
                onFocus={(evento) => evento.target.select()}
                onChange={(evento) => setPromocaoForm({ ...promocaoForm, valor: Number(evento.target.value) })}
              />
            </label>
            {promocaoForm.escopo === "PRODUTO" ? (
              <label>
                Produto
                <select
                  value={promocaoForm.produto_id}
                  onChange={(evento) => setPromocaoForm({ ...promocaoForm, produto_id: Number(evento.target.value) })}
                  disabled={!produtos.length}
                >
                  {produtos.map((produto) => (
                    <option key={produto.id} value={produto.id}>
                      {produto.nome}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {promocaoForm.escopo === "CATEGORIA" ? (
              <label>
                Categoria
                <select
                  value={promocaoForm.categoria_id}
                  onChange={(evento) => setPromocaoForm({ ...promocaoForm, categoria_id: Number(evento.target.value) })}
                  disabled={!categorias.length}
                >
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label>
              Inicio
              <input
                type="datetime-local"
                value={promocaoForm.inicio_em}
                onChange={(evento) => setPromocaoForm({ ...promocaoForm, inicio_em: evento.target.value })}
              />
            </label>
            <label>
              Fim
              <input
                type="datetime-local"
                value={promocaoForm.fim_em}
                onChange={(evento) => setPromocaoForm({ ...promocaoForm, fim_em: evento.target.value })}
              />
            </label>
            <button type="submit" disabled={!podeCriarPromocao}>
              Criar promocao
            </button>
          </form>

          <div className="promotion-list">
            {promocoes.map((promocao) => (
              <div className="data-row" key={promocao.id}>
                <div>
                  <strong>{promocao.nome}</strong>
                  <small>
                    {rotuloPromocao(promocao, produtos, categorias)} - {formatarDesconto(promocao.tipo_desconto, promocao.valor)}
                  </small>
                </div>
                <button type="button" onClick={() => aoAlternarPromocao(promocao)} disabled={carregando}>
                  {promocao.ativa ? "Inativar" : "Ativar"}
                </button>
              </div>
            ))}
            {!promocoes.length ? <p className="empty">Nenhuma promocao cadastrada ainda.</p> : null}
          </div>
        </section>

        <section className="panel form-panel wide-panel" id="estoque">
          <div className="panel-title">
            <ClipboardCheck size={20} aria-hidden="true" />
            <h2>Rastreabilidade operacional</h2>
          </div>

          <div className="operation-grid">
            <form className="stack" onSubmit={aoCancelarVenda}>
              <h3>Cancelamento</h3>
              <label>
                Venda
                <select
                  value={cancelamentoForm.venda_id}
                  onChange={(evento) => setCancelamentoForm({ ...cancelamentoForm, venda_id: Number(evento.target.value) })}
                >
                  <option value={0}>Selecione</option>
                  {vendas.map((venda) => (
                    <option key={venda.id} value={venda.id} disabled={venda.status === "CANCELADA"}>
                      {venda.numero_pedido} - {formatarMoeda(venda.total)} - {venda.status}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Motivo
                <textarea
                  maxLength={500}
                  value={cancelamentoForm.motivo}
                  onChange={(evento) => setCancelamentoForm({ ...cancelamentoForm, motivo: evento.target.value })}
                />
              </label>
              <button type="submit" disabled={carregando || !cancelamentoForm.venda_id}>
                Cancelar venda
              </button>
            </form>

            <form className="stack" onSubmit={aoRegistrarAjuste}>
              <h3>Ajuste manual</h3>
              <label>
                Insumo
                <select
                  value={ajusteForm.insumo_id}
                  onChange={(evento) => setAjusteForm({ ...ajusteForm, insumo_id: Number(evento.target.value) })}
                  disabled={!insumos.length}
                >
                  {insumos.map((insumo) => (
                    <option key={insumo.id} value={insumo.id}>
                      {insumo.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Diferenca
                <input
                  inputMode="decimal"
                  type="text"
                  value={ajusteForm.quantidade_diferenca}
                  onFocus={(evento) => evento.target.select()}
                  onChange={(evento) => setAjusteForm({ ...ajusteForm, quantidade_diferenca: Number(evento.target.value) })}
                />
              </label>
              <label>
                Motivo
                <input
                  value={ajusteForm.motivo}
                  onChange={(evento) => setAjusteForm({ ...ajusteForm, motivo: evento.target.value })}
                />
              </label>
              <button type="submit" disabled={carregando || !insumos.length}>
                Registrar ajuste
              </button>
            </form>

            <form className="stack" onSubmit={aoRegistrarPerda}>
              <h3>Perda</h3>
              <label>
                Insumo
                <select
                  value={perdaForm.insumo_id}
                  onChange={(evento) => setPerdaForm({ ...perdaForm, insumo_id: Number(evento.target.value) })}
                  disabled={!insumos.length}
                >
                  {insumos.map((insumo) => (
                    <option key={insumo.id} value={insumo.id}>
                      {insumo.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Quantidade
                <input
                  inputMode="decimal"
                  type="text"
                  value={perdaForm.quantidade}
                  onFocus={(evento) => evento.target.select()}
                  onChange={(evento) => setPerdaForm({ ...perdaForm, quantidade: Number(evento.target.value) })}
                />
              </label>
              <label>
                Motivo
                <input
                  value={perdaForm.motivo}
                  onChange={(evento) => setPerdaForm({ ...perdaForm, motivo: evento.target.value })}
                />
              </label>
              <button type="submit" disabled={carregando || !insumos.length}>
                Registrar perda
              </button>
            </form>

            <form className="stack" onSubmit={aoConfirmarConferencia}>
              <h3>Conferencia diaria</h3>
              <label>
                Data
                <input
                  type="date"
                  value={conferenciaForm.data}
                  onChange={(evento) => setConferenciaForm({ ...conferenciaForm, data: evento.target.value })}
                />
              </label>
              <label>
                Observacao
                <input
                  value={conferenciaForm.observacao}
                  onChange={(evento) => setConferenciaForm({ ...conferenciaForm, observacao: evento.target.value })}
                />
              </label>
              <button type="submit" disabled={carregando}>
                Confirmar estoque
              </button>
              <p className="empty">
                Ultima conferencia: {conferencias[0]?.data ?? "nenhuma"}
              </p>
            </form>
          </div>

          <div className="movement-list">
            <h3>Movimentacoes recentes</h3>
            <div className="stack">
              {movimentacoes.slice(0, 8).map((movimentacao) => (
                <div className="data-row" key={movimentacao.id}>
                  <div>
                    <strong>{movimentacao.tipo}</strong>
                    <small>
                      {nomeInsumo(movimentacao.insumo_id, insumos)} - {formatarQuantidade(movimentacao.quantidade)} - {movimentacao.motivo ?? "sem motivo"}
                    </small>
                  </div>
                  <span className="mini-status ok">{formatarQuantidade(movimentacao.estoque_depois)}</span>
                </div>
              ))}
              {!movimentacoes.length ? <p className="empty">Nenhuma movimentacao registrada ainda.</p> : null}
            </div>
          </div>
        </section>

        <section className="panel detail-panel wide-panel" id="variacoes">
          <div className="panel-title">
            <ListChecks size={20} aria-hidden="true" />
            <h2>Variacoes do item</h2>
          </div>

          {produtoSelecionado ? (
            <form className="variation-grid" onSubmit={aoSimularItem}>
              <div>
                <h3>Adicionais permitidos</h3>
                <div className="stack">
                  {variacoes?.adicionais.map((adicional) => (
                    <label className="option-row" key={adicional.id}>
                      <input
                        type="checkbox"
                        checked={simulacaoForm.adicional_ids.includes(adicional.id)}
                        onChange={() => alternarId("adicional_ids", adicional.id)}
                      />
                      <span>
                        {adicional.nome}
                        <small>{formatarMoeda(adicional.preco_extra)}</small>
                      </span>
                    </label>
                  ))}
                  {!variacoes?.adicionais.length ? <p className="empty">Nenhum adicional permitido para este produto.</p> : null}
                </div>
              </div>

              <div>
                <h3>Remocoes permitidas</h3>
                <div className="stack">
                  {variacoes?.remocoes_permitidas.map((remocao) => (
                    <label className="option-row" key={remocao.item_ficha_tecnica_id}>
                      <input
                        type="checkbox"
                        checked={simulacaoForm.remocao_item_ficha_tecnica_ids.includes(remocao.item_ficha_tecnica_id)}
                        onChange={() => alternarId("remocao_item_ficha_tecnica_ids", remocao.item_ficha_tecnica_id)}
                      />
                      <span>
                        {remocao.nome_insumo}
                        <small>
                          {formatarQuantidade(remocao.quantidade)} {nomeUnidade(remocao.unidade_medida_id, unidades)}
                        </small>
                      </span>
                    </label>
                  ))}
                  {!variacoes?.remocoes_permitidas.length ? (
                    <p className="empty">Nenhum insumo removivel marcado na ficha tecnica.</p>
                  ) : null}
                </div>
              </div>

              <label className="wide">
                <MessageSquare size={18} aria-hidden="true" />
                Observacao do item
                <textarea
                  maxLength={255}
                  value={simulacaoForm.observacao}
                  onChange={(evento) => setSimulacaoForm({ ...simulacaoForm, observacao: evento.target.value })}
                />
              </label>

              <button type="submit" disabled={carregando || !produtoSelecionado.vendavel}>
                Simular item
              </button>
            </form>
          ) : (
            <p className="empty">Selecione um produto para ver adicionais e remocoes.</p>
          )}

          {simulacao ? (
            <div className="simulation-result">
              <Metric label="Preco total" value={formatarMoeda(simulacao.preco_total)} />
              <Metric label="Adicionais" value={formatarMoeda(simulacao.preco_adicionais)} />
              <Metric label="Estoque" value={simulacao.estoque_suficiente ? "Suficiente" : "Insuficiente"} />
              <div className="wide">
                <h3>Baixa prevista</h3>
                <div className="stack">
                  {simulacao.baixas_previstas.map((baixa) => (
                    <div className="data-row" key={baixa.insumo_id}>
                      <div>
                        <strong>{baixa.nome_insumo}</strong>
                        <small>
                          {formatarQuantidade(baixa.quantidade)} de {formatarQuantidade(baixa.estoque_atual)} em estoque
                        </small>
                      </div>
                      <span className={`mini-status ${baixa.suficiente ? "ok" : "blocked"}`}>
                        {baixa.suficiente ? "OK" : "Falta"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <section className="panel wide-panel" id="recomendacoes">
          <div className="panel-title">
            <ClipboardCheck size={20} aria-hidden="true" />
            <h2>Recomendacoes (Programacao Linear)</h2>
            <button className="icon-button" type="button" onClick={aoGerarRecomendacao} disabled={carregando} title="Gerar Recomendacao">
              <CirclePlus size={18} aria-hidden="true" />
            </button>
          </div>
          {recomendacoes.length > 0 ? (
            <div className="stack table-container">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Fator de Confianca</th>
                    <th>Lucro Estimado</th>
                    <th>Capacidade Usada</th>
                    <th>Insumos Limitantes</th>
                    <th>Itens</th>
                  </tr>
                </thead>
                <tbody>
                  {recomendacoes.map((rec) => (
                    <tr key={rec.id}>
                      <td>{new Date(rec.criado_em).toLocaleDateString("pt-BR")} as {new Date(rec.criado_em).toLocaleTimeString("pt-BR")}</td>
                      <td>{rec.fator_confianca}/10</td>
                      <td>{formatarMoeda(rec.lucro_estimado)}</td>
                      <td>{rec.capacidade_usada}/{rec.capacidade_total} itens</td>
                      <td>{rec.insumos_limitantes || "Nenhum"}</td>
                      <td>
                        <small>
                          {rec.itens.map(item => `${item.produto_nome} (${item.quantidade_recomendada} unid)`).join(", ")}
                        </small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
             <p className="empty">Nenhuma recomendacao gerada.</p>
          )}
        </section>

        {usuario.papel === "OWNER" || usuario.papel === "MANAGER" ? (
          <section className="panel wide-panel" id="backups">
            <div className="panel-title">
              <Boxes size={20} aria-hidden="true" />
              <h2>Backups Locais</h2>
              <button className="icon-button" type="button" onClick={aoGerarBackup} disabled={carregando} title="Gerar Backup Manual">
                <Download size={18} aria-hidden="true" />
              </button>
            </div>
            {backups.length > 0 ? (
              <div className="stack table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Arquivo</th>
                      <th>Tamanho</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map((bkp, i) => (
                      <tr key={String(i)}>
                        <td>{new Date(bkp.data_criacao).toLocaleString("pt-BR")}</td>
                        <td>{bkp.nome_arquivo}</td>
                        <td>{(bkp.tamanho_bytes / 1024).toFixed(2)} KB</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
                <p className="empty">Nenhum backup localizado.</p>
            )}
          </section>
        ) : null}

        </section>
        )}
        </>
      )}

      <p className="message">{mensagem}</p>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatarMoeda(valor: string) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarQuantidade(valor: string) {
  return Number(valor).toLocaleString("pt-BR", {
    maximumFractionDigits: 3,
  });
}

function nomeCategoria(categoriaId: number, categorias: Categoria[]) {
  return categorias.find((categoria) => categoria.id === categoriaId)?.nome ?? `Categoria ${categoriaId}`;
}

function nomeUnidade(unidadeId: number, unidades: UnidadeMedida[]) {
  return unidades.find((unidade) => unidade.id === unidadeId)?.sigla ?? "";
}

function nomeInsumo(insumoId: number, insumos: Insumo[]) {
  return insumos.find((insumo) => insumo.id === insumoId)?.nome ?? `Insumo ${insumoId}`;
}

function rotuloPromocao(promocao: Promocao, produtos: Produto[], categorias: Categoria[]) {
  if (promocao.escopo === "PRODUTO") {
    return `Produto: ${produtos.find((produto) => produto.id === promocao.produto_id)?.nome ?? promocao.produto_id}`;
  }
  if (promocao.escopo === "CATEGORIA") {
    return `Categoria: ${nomeCategoria(promocao.categoria_id ?? 0, categorias)}`;
  }
  return "Venda inteira";
}

function formatarDesconto(tipo: string, valor: string) {
  return tipo === "PERCENTUAL" ? `${Number(valor).toLocaleString("pt-BR")}%` : formatarMoeda(valor);
}

function atuaisComQuantidadeValida(itens: ItemCarrinho[]) {
  return itens
    .filter((item) => item.quantidade > 0)
    .map((item) => ({
      ...item,
      preco_total: item.preco_unitario * item.quantidade,
    }));
}
