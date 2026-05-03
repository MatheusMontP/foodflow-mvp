import {
  Activity,
  BadgeCheck,
  Boxes,
  Calculator,
  LogIn,
  LogOut,
  PackagePlus,
  RefreshCw,
  ShieldPlus,
  ShoppingCart,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  atualizarStatusProduto,
  buscarUsuarioAtual,
  cadastrarProduto,
  Categoria,
  criarPrimeiroOwner,
  Insumo,
  ItemFichaTecnicaCriar,
  listarCategorias,
  listarInsumos,
  listarProdutos,
  listarUnidadesMedida,
  Produto,
  recalcularProduto,
  salvarFichaTecnica,
  StatusProduto,
  UnidadeMedida,
  login,
  Usuario,
} from "../servicos/api";

export function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [verificandoSessao, setVerificandoSessao] = useState(true);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [unidades, setUnidades] = useState<UnidadeMedida[]>([]);
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState<number | null>(null);
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

  const produtoSelecionado = useMemo(
    () => produtos.find((produto) => produto.id === produtoSelecionadoId) ?? produtos[0],
    [produtoSelecionadoId, produtos],
  );
  const podeCriarProduto = categorias.length > 0 && !carregando;
  const podeSalvarFicha = Boolean(produtoSelecionado) && insumos.length > 0 && unidades.length > 0 && !carregando;

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
    setProdutoSelecionadoId(null);
    setMensagem("Sessao encerrada.");
  }

  async function carregarDados() {
    setCarregando(true);
    try {
      const [categoriasDados, insumosDados, unidadesDados, produtosDados] = await Promise.all([
        listarCategorias(),
        listarInsumos(),
        listarUnidadesMedida(),
        listarProdutos(),
      ]);

      setCategorias(categoriasDados);
      setInsumos(insumosDados);
      setUnidades(unidadesDados);
      setProdutos(produtosDados);
      setProdutoSelecionadoId((atual) => atual ?? produtosDados[0]?.id ?? null);
      setProdutoForm((atual) => ({ ...atual, categoria_id: categoriasDados[0]?.id ?? 0 }));
      setItemForm((atual) => ({
        ...atual,
        insumo_id: insumosDados[0]?.id ?? 0,
        unidade_medida_id: unidadesDados[0]?.id ?? 0,
      }));

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

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">FoodFlow Gestao</p>
          <h1>Produtos, ficha tecnica e disponibilidade</h1>
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
        <section className="workspace">
        <aside className="panel product-list" aria-label="Produtos cadastrados">
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

        <section className="panel form-panel">
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

        <section className="panel form-panel">
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
        </section>
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
