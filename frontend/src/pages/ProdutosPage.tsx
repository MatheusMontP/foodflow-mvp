import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Utensils,
} from "lucide-react";
import {
  atualizarProduto,
  atualizarStatusProduto,
  cadastrarProduto,
  excluirProduto,
  listarCategorias,
  listarInsumos,
  listarProdutos,
  listarUnidadesMedida,
  type Categoria,
  type Insumo,
  type Produto,
  type UnidadeMedida,
} from "@/servicos/api";

type ProdutoForm = {
  nome: string;
  descricao: string;
  categoria_id: string;
  preco_venda: string;
  demanda_esperada_diaria: string;
};

type ItemFichaForm = {
  insumo_id: string;
  quantidade: string;
  unidade_medida_id: string;
  removivel: boolean;
};

const formInicial: ProdutoForm = {
  nome: "",
  descricao: "",
  categoria_id: "",
  preco_venda: "",
  demanda_esperada_diaria: "0",
};

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none transition-colors focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

function criarItemFicha(insumo?: Insumo): ItemFichaForm {
  return {
    insumo_id: insumo ? String(insumo.id) : "",
    quantidade: "1",
    unidade_medida_id: insumo ? String(insumo.unidade_medida_id) : "",
    removivel: false,
  };
}

export function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [unidades, setUnidades] = useState<UnidadeMedida[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [formData, setFormData] = useState<ProdutoForm>(formInicial);
  const [itensFicha, setItensFicha] = useState<ItemFichaForm[]>([]);

  async function carregarDados() {
    setLoading(true);
    try {
      const [produtosDados, categoriasDados, insumosDados, unidadesDados] =
        await Promise.all([
          listarProdutos(),
          listarCategorias(),
          listarInsumos(),
          listarUnidadesMedida(),
        ]);
      setProdutos(produtosDados);
      setCategorias(categoriasDados);
      setInsumos(insumosDados);
      setUnidades(unidadesDados);
      setErro("");
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Nao foi possivel carregar os produtos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void carregarDados();
    const atualizar = () => void carregarDados();
    window.addEventListener("foodflow:data-updated", atualizar);
    return () => window.removeEventListener("foodflow:data-updated", atualizar);
  }, []);

  const categoriasPorId = useMemo(
    () => new Map(categorias.map((categoria) => [categoria.id, categoria])),
    [categorias]
  );

  const insumosAtivos = useMemo(
    () => insumos.filter((insumo) => insumo.ativo),
    [insumos]
  );

  const insumosPorId = useMemo(
    () => new Map(insumos.map((insumo) => [insumo.id, insumo])),
    [insumos]
  );

  const unidadesPorId = useMemo(
    () => new Map(unidades.map((unidade) => [unidade.id, unidade])),
    [unidades]
  );

  const filteredProducts = produtos.filter((produto) =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const produtosVendaveis = produtos.filter((produto) => produto.vendavel).length;
  const produtosSemFicha = produtos.filter((produto) => !produto.ficha_tecnica_valida).length;

  const handleOpenDialog = (produto?: Produto) => {
    if (produto) {
      setEditingProduct(produto);
      setFormData({
        nome: produto.nome,
        descricao: produto.descricao ?? "",
        categoria_id: String(produto.categoria_id),
        preco_venda: String(produto.preco_venda),
        demanda_esperada_diaria: String(produto.demanda_esperada_diaria),
      });
      setItensFicha(
        produto.itens_ficha_tecnica.map((item) => ({
          insumo_id: String(item.insumo_id),
          quantidade: String(item.quantidade),
          unidade_medida_id: String(item.unidade_medida_id),
          removivel: item.removivel,
        }))
      );
    } else {
      const primeiraCategoria = categorias.find((categoria) => categoria.ativo);
      setEditingProduct(null);
      setFormData({
        ...formInicial,
        categoria_id: primeiraCategoria ? String(primeiraCategoria.id) : "",
      });
      setItensFicha([criarItemFicha(insumosAtivos[0])]);
    }
    setMensagem("");
    setErro("");
    setDialogOpen(true);
  };

  const handleAdicionarInsumo = () => {
    setItensFicha((prev) => [...prev, criarItemFicha(insumosAtivos[0])]);
  };

  const handleRemoverInsumo = (index: number) => {
    setItensFicha((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleAlterarItem = (
    index: number,
    campo: keyof ItemFichaForm,
    valor: string | boolean
  ) => {
    setItensFicha((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        if (campo === "insumo_id") {
          const insumo = insumosPorId.get(Number(valor));
          return {
            ...item,
            insumo_id: String(valor),
            unidade_medida_id: insumo ? String(insumo.unidade_medida_id) : "",
          };
        }

        return { ...item, [campo]: valor };
      })
    );
  };

  const montarPayload = () => ({
    nome: formData.nome.trim(),
    descricao: formData.descricao.trim() || undefined,
    categoria_id: Number(formData.categoria_id),
    preco_venda: Number(formData.preco_venda),
    demanda_esperada_diaria: Number(formData.demanda_esperada_diaria || 0),
    itens_ficha_tecnica: itensFicha.map((item) => ({
      insumo_id: Number(item.insumo_id),
      quantidade: Number(item.quantidade),
      unidade_medida_id: Number(item.unidade_medida_id),
      removivel: item.removivel,
    })),
  });

  const formularioValido =
    formData.nome.trim().length >= 2 &&
    Number(formData.categoria_id) > 0 &&
    Number(formData.preco_venda) >= 0 &&
    itensFicha.length > 0 &&
    itensFicha.every(
      (item) =>
        Number(item.insumo_id) > 0 &&
        Number(item.unidade_medida_id) > 0 &&
        Number(item.quantidade) > 0
    );

  const handleSave = async () => {
    if (!formularioValido) {
      setMensagem("Informe categoria, preco e pelo menos um insumo com quantidade.");
      return;
    }

    setSalvando(true);
    try {
      const payload = montarPayload();
      const produtoSalvo = editingProduct
        ? await atualizarProduto(editingProduct.id, payload)
        : await cadastrarProduto(payload);

      setProdutos((prev) => {
        if (editingProduct) {
          return prev.map((produto) => (produto.id === produtoSalvo.id ? produtoSalvo : produto));
        }
        return [...prev, produtoSalvo].sort((a, b) => a.nome.localeCompare(b.nome));
      });
      setDialogOpen(false);
      setMensagem(editingProduct ? "Produto atualizado com insumos." : "Produto criado com insumos.");
      window.dispatchEvent(new Event("foodflow:data-updated"));
    } catch (falha) {
      setMensagem(falha instanceof Error ? falha.message : "Nao foi possivel salvar o produto.");
    } finally {
      setSalvando(false);
    }
  };

  const handleToggleStatus = async (produto: Produto) => {
    const proximoStatus = produto.status === "ATIVO" ? "INATIVO" : "ATIVO";
    try {
      const atualizado = await atualizarStatusProduto(produto.id, proximoStatus);
      setProdutos((prev) => prev.map((item) => (item.id === atualizado.id ? atualizado : item)));
      setMensagem(`Produto ${proximoStatus === "ATIVO" ? "ativado" : "inativado"}.`);
      window.dispatchEvent(new Event("foodflow:data-updated"));
    } catch (falha) {
      setMensagem(falha instanceof Error ? falha.message : "Nao foi possivel alterar o status.");
    }
  };

  const handleExcluirProduto = async (produto: Produto) => {
    if (!confirm(`Deseja realmente excluir o produto "${produto.nome}"?`)) return;

    try {
      await excluirProduto(produto.id);
      setProdutos((prev) => prev.filter((item) => item.id !== produto.id));
      setMensagem("Produto excluido com sucesso.");
      window.dispatchEvent(new Event("foodflow:data-updated"));
    } catch (falha) {
      setMensagem(falha instanceof Error ? falha.message : "Nao foi possivel excluir o produto.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="success">{produtosVendaveis} vendaveis</Badge>
          {produtosSemFicha > 0 && <Badge variant="warning">{produtosSemFicha} sem ficha</Badge>}
          <Button variant="outline" onClick={() => void carregarDados()}>
            <RefreshCw className="size-4" />
            Atualizar
          </Button>
          <Button
            onClick={() => handleOpenDialog()}
            disabled={loading || insumosAtivos.length === 0 || categorias.length === 0}
            title={
              insumosAtivos.length === 0
                ? "Cadastre um insumo ativo antes de criar produtos"
                : undefined
            }
          >
            <Plus className="size-4" />
            Novo Produto
          </Button>
        </div>
      </div>

      {(erro || mensagem) && (
        <p className={erro ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
          {erro || mensagem}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Produtos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 size-5 animate-spin" />
              Carregando produtos...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preco</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead>Margem</TableHead>
                  <TableHead>Ficha tecnica</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      Nenhum produto encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((produto) => (
                    <TableRow key={produto.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          <span>{produto.nome}</span>
                          {produto.descricao && (
                            <span className="text-xs font-normal text-muted-foreground">
                              {produto.descricao}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {categoriasPorId.get(produto.categoria_id)?.nome ?? "-"}
                      </TableCell>
                      <TableCell>{formatCurrency(produto.preco_venda)}</TableCell>
                      <TableCell>{formatCurrency(produto.custo_ficha_tecnica)}</TableCell>
                      <TableCell>{formatCurrency(produto.margem_estimada)}</TableCell>
                      <TableCell>
                        <Badge variant={produto.ficha_tecnica_valida ? "success" : "warning"}>
                          {produto.itens_ficha_tecnica.length} insumo(s)
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={produto.status === "ATIVO" ? "success" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => void handleToggleStatus(produto)}
                          title={produto.motivo_indisponibilidade ?? undefined}
                        >
                          {produto.status === "ATIVO" ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(produto)}
                            title="Editar produto"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => void handleExcluirProduto(produto)}
                            title="Excluir produto"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-5 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nome: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="categoria">Categoria</Label>
                <select
                  id="categoria"
                  value={formData.categoria_id}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, categoria_id: e.target.value }))
                  }
                  className={selectClass}
                >
                  <option value="">Selecione</option>
                  {categorias
                    .filter((categoria) => categoria.ativo)
                    .map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="preco">Preco de venda</Label>
                <Input
                  id="preco"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.preco_venda}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, preco_venda: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="demanda">Demanda diaria</Label>
                <Input
                  id="demanda"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.demanda_esperada_diaria}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      demanda_esperada_diaria: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="descricao">Descricao</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, descricao: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Utensils className="size-4 text-primary" />
                <h3 className="text-sm font-semibold">Insumos do produto</h3>
              </div>
              <Button type="button" variant="outline" onClick={handleAdicionarInsumo}>
                <Plus className="size-4" />
                Adicionar insumo
              </Button>
            </div>

            <div className="flex flex-col gap-3">
              {itensFicha.map((item, index) => (
                <div
                  key={`${index}-${item.insumo_id}`}
                  className="grid gap-3 rounded-md border p-3 md:grid-cols-[1.5fr_0.7fr_0.8fr_auto_auto]"
                >
                  <div className="flex flex-col gap-2">
                    <Label>Insumo</Label>
                    <select
                      value={item.insumo_id}
                      onChange={(e) => handleAlterarItem(index, "insumo_id", e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Selecione</option>
                      {insumosAtivos.map((insumo) => (
                        <option key={insumo.id} value={insumo.id}>
                          {insumo.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      min="0.001"
                      step="0.001"
                      value={item.quantidade}
                      onChange={(e) => handleAlterarItem(index, "quantidade", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Unidade</Label>
                    <select
                      value={item.unidade_medida_id}
                      onChange={(e) =>
                        handleAlterarItem(index, "unidade_medida_id", e.target.value)
                      }
                      className={selectClass}
                    >
                      <option value="">Selecione</option>
                      {unidades
                        .filter((unidade) => unidade.ativa)
                        .map((unidade) => (
                          <option key={unidade.id} value={unidade.id}>
                            {unidade.sigla}
                          </option>
                        ))}
                    </select>
                  </div>
                  <label className="flex items-center gap-2 pt-7 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={item.removivel}
                      onChange={(e) => handleAlterarItem(index, "removivel", e.target.checked)}
                    />
                    Removivel
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="self-end text-destructive"
                    onClick={() => handleRemoverInsumo(index)}
                    disabled={itensFicha.length === 1}
                    title="Remover insumo"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>

            {mensagem && <p className="text-sm text-muted-foreground">{mensagem}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={() => void handleSave()} disabled={salvando || !formularioValido}>
              {salvando && <Loader2 className="size-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
