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
import { Plus, Pencil, Trash2, Tag, Percent, Loader2 } from "lucide-react";
import {
  atualizarPromocao,
  atualizarStatusPromocao,
  cadastrarPromocao,
  excluirPromocao,
  listarCategorias,
  listarProdutos,
  listarPromocoes,
  type Categoria,
  type EscopoPromocao,
  type Produto,
  type Promocao,
  type PromocaoCriar,
  type TipoDesconto,
} from "@/servicos/api";

type FormData = {
  nome: string;
  escopo: EscopoPromocao;
  tipo_desconto: TipoDesconto;
  valor: string;
  quantidade_leve: string;
  quantidade_pague: string;
  produto_id: string;
  categoria_id: string;
  inicio_em: string;
  fim_em: string;
  ativa: boolean;
};

type ModeloPromocao =
  | "PERCENTUAL_25"
  | "PERCENTUAL_CUSTOM"
  | "VALOR_FIXO"
  | "LEVE_3_PAGUE_2"
  | "LEVE_4_PAGUE_3"
  | "LEVE_PAGUE_CUSTOM";

const formInicial: FormData = {
  nome: "",
  escopo: "VENDA",
  tipo_desconto: "PERCENTUAL",
  valor: "25",
  quantidade_leve: "",
  quantidade_pague: "",
  produto_id: "",
  categoria_id: "",
  inicio_em: "",
  fim_em: "",
  ativa: true,
};

const modelosPromocao: {
  id: ModeloPromocao;
  titulo: string;
  descricao: string;
}[] = [
  { id: "PERCENTUAL_25", titulo: "25% de desconto", descricao: "Modelo rapido para um desconto percentual comum." },
  { id: "PERCENTUAL_CUSTOM", titulo: "% personalizado", descricao: "Escolha qualquer percentual de desconto." },
  { id: "VALOR_FIXO", titulo: "Valor fixo", descricao: "Desconte um valor em reais do item ou venda." },
  { id: "LEVE_3_PAGUE_2", titulo: "3 pelo preco de 2", descricao: "A cada 3 unidades, 1 sai gratis." },
  { id: "LEVE_4_PAGUE_3", titulo: "4 pelo preco de 3", descricao: "A cada 4 unidades, 1 sai gratis." },
  { id: "LEVE_PAGUE_CUSTOM", titulo: "Leve e pague", descricao: "Defina manualmente quantos leva e quantos paga." },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "Sem limite";
  return new Date(value).toLocaleDateString("pt-BR");
}

function dateInputValue(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function toApiDate(value: string, endOfDay = false) {
  if (!value) return undefined;
  return `${value}T${endOfDay ? "23:59:59" : "00:00:00"}`;
}

function modeloDaPromocao(promocao: Promocao): ModeloPromocao {
  if (promocao.tipo_desconto === "LEVE_PAGUE") {
    if (promocao.quantidade_leve === 3 && promocao.quantidade_pague === 2) return "LEVE_3_PAGUE_2";
    if (promocao.quantidade_leve === 4 && promocao.quantidade_pague === 3) return "LEVE_4_PAGUE_3";
    return "LEVE_PAGUE_CUSTOM";
  }
  if (promocao.tipo_desconto === "VALOR_FIXO") return "VALOR_FIXO";
  return Number(promocao.valor) === 25 ? "PERCENTUAL_25" : "PERCENTUAL_CUSTOM";
}

function formatTipo(promocao: Promocao) {
  if (promocao.tipo_desconto === "LEVE_PAGUE") return "Leve e pague";
  return promocao.tipo_desconto === "PERCENTUAL" ? "Percentual" : "Valor fixo";
}

function formatEscopo(escopo: EscopoPromocao) {
  switch (escopo) {
    case "PRODUTO":
      return "Produto";
    case "CATEGORIA":
      return "Categoria";
    default:
      return "Venda inteira";
  }
}

function formatValor(promocao: Promocao) {
  const valor = Number(promocao.valor);
  if (promocao.tipo_desconto === "LEVE_PAGUE") {
    return `Leve ${promocao.quantidade_leve ?? "-"} pague ${promocao.quantidade_pague ?? "-"}`;
  }
  return promocao.tipo_desconto === "PERCENTUAL" ? `${valor.toLocaleString("pt-BR")}%` : formatCurrency(valor);
}

export function PromocoesPage() {
  const [promocoes, setPromocoes] = useState<Promocao[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPromocao, setEditingPromocao] = useState<Promocao | null>(null);
  const [formData, setFormData] = useState<FormData>(formInicial);
  const [modeloSelecionado, setModeloSelecionado] = useState<ModeloPromocao>("PERCENTUAL_25");

  async function carregarDados() {
    setLoading(true);
    try {
      const [promocoesDados, categoriasDados, produtosDados] = await Promise.all([
        listarPromocoes(),
        listarCategorias(),
        listarProdutos(),
      ]);
      setPromocoes(promocoesDados);
      setCategorias(categoriasDados.filter((categoria) => categoria.ativo));
      setProdutos(produtosDados.filter((produto) => produto.status === "ATIVO"));
      setMensagem("");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel carregar as promocoes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void carregarDados();
  }, []);

  const promocoesAtivas = useMemo(
    () => promocoes.filter((promocao) => promocao.ativa),
    [promocoes]
  );

  function handleOpenDialog(promocao?: Promocao) {
    if (promocao) {
      setEditingPromocao(promocao);
      setFormData({
        nome: promocao.nome,
        escopo: promocao.escopo,
        tipo_desconto: promocao.tipo_desconto,
        valor: String(promocao.valor),
        quantidade_leve: promocao.quantidade_leve ? String(promocao.quantidade_leve) : "",
        quantidade_pague: promocao.quantidade_pague ? String(promocao.quantidade_pague) : "",
        produto_id: promocao.produto_id ? String(promocao.produto_id) : "",
        categoria_id: promocao.categoria_id ? String(promocao.categoria_id) : "",
        inicio_em: dateInputValue(promocao.inicio_em),
        fim_em: dateInputValue(promocao.fim_em),
        ativa: promocao.ativa,
      });
      setModeloSelecionado(modeloDaPromocao(promocao));
    } else {
      setEditingPromocao(null);
      setFormData(formInicial);
      setModeloSelecionado("PERCENTUAL_25");
    }
    setMensagem("");
    setDialogOpen(true);
  }

  function aplicarModelo(modelo: ModeloPromocao) {
    setModeloSelecionado(modelo);
    setFormData((prev) => {
      if (modelo === "PERCENTUAL_25") {
        return {
          ...prev,
          tipo_desconto: "PERCENTUAL",
          valor: "25",
          quantidade_leve: "",
          quantidade_pague: "",
        };
      }
      if (modelo === "PERCENTUAL_CUSTOM") {
        return {
          ...prev,
          tipo_desconto: "PERCENTUAL",
          valor: prev.tipo_desconto === "PERCENTUAL" ? prev.valor : "",
          quantidade_leve: "",
          quantidade_pague: "",
        };
      }
      if (modelo === "VALOR_FIXO") {
        return {
          ...prev,
          tipo_desconto: "VALOR_FIXO",
          valor: prev.tipo_desconto === "VALOR_FIXO" ? prev.valor : "",
          quantidade_leve: "",
          quantidade_pague: "",
        };
      }
      if (modelo === "LEVE_3_PAGUE_2") {
        return {
          ...prev,
          escopo: prev.escopo === "VENDA" ? "PRODUTO" : prev.escopo,
          tipo_desconto: "LEVE_PAGUE",
          valor: "0",
          quantidade_leve: "3",
          quantidade_pague: "2",
        };
      }
      if (modelo === "LEVE_4_PAGUE_3") {
        return {
          ...prev,
          escopo: prev.escopo === "VENDA" ? "PRODUTO" : prev.escopo,
          tipo_desconto: "LEVE_PAGUE",
          valor: "0",
          quantidade_leve: "4",
          quantidade_pague: "3",
        };
      }
      return {
        ...prev,
        escopo: prev.escopo === "VENDA" ? "PRODUTO" : prev.escopo,
        tipo_desconto: "LEVE_PAGUE",
        valor: "0",
        quantidade_leve: prev.quantidade_leve || "3",
        quantidade_pague: prev.quantidade_pague || "2",
      };
    });
  }

  function montarPayload(): PromocaoCriar | null {
    const valor = Number(formData.valor);
    const quantidadeLeve = Number(formData.quantidade_leve);
    const quantidadePague = Number(formData.quantidade_pague);

    if (!formData.nome.trim()) {
      setMensagem("Informe o nome da promocao.");
      return null;
    }

    if (formData.tipo_desconto !== "LEVE_PAGUE" && (!Number.isFinite(valor) || valor <= 0)) {
      setMensagem("Informe um valor de desconto valido.");
      return null;
    }

    if (formData.tipo_desconto === "LEVE_PAGUE") {
      if (formData.escopo === "VENDA") {
        setMensagem("Leve e pague precisa ser aplicado a um produto ou categoria.");
        return null;
      }
      if (
        !Number.isInteger(quantidadeLeve) ||
        !Number.isInteger(quantidadePague) ||
        quantidadeLeve < 2 ||
        quantidadePague < 1 ||
        quantidadePague >= quantidadeLeve
      ) {
        setMensagem("Informe uma regra valida, como leve 3 e pague 2.");
        return null;
      }
    }

    if (formData.escopo === "PRODUTO" && !formData.produto_id) {
      setMensagem("Escolha o produto da promocao.");
      return null;
    }

    if (formData.escopo === "CATEGORIA" && !formData.categoria_id) {
      setMensagem("Escolha a categoria da promocao.");
      return null;
    }

    return {
      nome: formData.nome.trim(),
      escopo: formData.escopo,
      tipo_desconto: formData.tipo_desconto,
      valor: formData.tipo_desconto === "LEVE_PAGUE" ? 0 : valor,
      quantidade_leve: formData.tipo_desconto === "LEVE_PAGUE" ? quantidadeLeve : undefined,
      quantidade_pague: formData.tipo_desconto === "LEVE_PAGUE" ? quantidadePague : undefined,
      produto_id: formData.escopo === "PRODUTO" ? Number(formData.produto_id) : undefined,
      categoria_id: formData.escopo === "CATEGORIA" ? Number(formData.categoria_id) : undefined,
      inicio_em: toApiDate(formData.inicio_em),
      fim_em: toApiDate(formData.fim_em, true),
      ativa: formData.ativa,
    };
  }

  async function handleSave() {
    const payload = montarPayload();
    if (!payload) return;

    setSalvando(true);
    try {
      if (editingPromocao) {
        const atualizada = await atualizarPromocao(editingPromocao.id, {
          nome: payload.nome,
          tipo_desconto: payload.tipo_desconto,
          valor: payload.valor,
          quantidade_leve: payload.quantidade_leve,
          quantidade_pague: payload.quantidade_pague,
          inicio_em: payload.inicio_em,
          fim_em: payload.fim_em,
          ativa: payload.ativa,
        });
        setPromocoes((prev) =>
          prev.map((promocao) => (promocao.id === atualizada.id ? atualizada : promocao))
        );
      } else {
        const criada = await cadastrarPromocao(payload);
        setPromocoes((prev) => [criada, ...prev]);
      }
      setDialogOpen(false);
      setMensagem("");
      window.dispatchEvent(new Event("foodflow:data-updated"));
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel salvar a promocao.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Deseja realmente excluir esta promocao?")) return;

    try {
      await excluirPromocao(id);
      setPromocoes((prev) => prev.filter((promocao) => promocao.id !== id));
      window.dispatchEvent(new Event("foodflow:data-updated"));
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel excluir a promocao.");
    }
  }

  async function handleToggleAtiva(promocao: Promocao) {
    try {
      const atualizada = await atualizarStatusPromocao(promocao.id, !promocao.ativa);
      setPromocoes((prev) =>
        prev.map((item) => (item.id === atualizada.id ? atualizada : item))
      );
      window.dispatchEvent(new Event("foodflow:data-updated"));
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel alterar o status.");
    }
  }

  function alvoPromocao(promocao: Promocao) {
    if (promocao.escopo === "PRODUTO") {
      return produtos.find((produto) => produto.id === promocao.produto_id)?.nome ?? "Produto removido";
    }
    if (promocao.escopo === "CATEGORIA") {
      return categorias.find((categoria) => categoria.id === promocao.categoria_id)?.nome ?? "Categoria removida";
    }
    return "Venda inteira";
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Promocoes</h2>
          <p className="text-muted-foreground">Cadastre descontos aplicados automaticamente no PDV</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="size-4" />
          Nova promocao
        </Button>
      </div>

      {mensagem && <p className="text-sm text-muted-foreground">{mensagem}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {promocoesAtivas.map((promocao) => (
          <Card key={promocao.id} className="relative overflow-hidden">
            <div className="absolute right-0 top-0 rounded-bl-lg bg-primary px-3 py-1">
              <Percent className="size-4 text-primary-foreground" />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 pr-8">
                <Tag className="size-5 text-primary" />
                {promocao.nome}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2 text-2xl font-bold text-primary">{formatValor(promocao)}</div>
              <p className="text-sm text-muted-foreground">{formatEscopo(promocao.escopo)}: {alvoPromocao(promocao)}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Valida de {formatDate(promocao.inicio_em)} ate {formatDate(promocao.fim_em)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas as promocoes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="mr-2 size-5 animate-spin" />
              Carregando promocoes...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Escopo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promocoes.map((promocao) => (
                  <TableRow key={promocao.id}>
                    <TableCell className="font-medium">{promocao.nome}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{formatEscopo(promocao.escopo)}</span>
                        <span className="text-xs text-muted-foreground">{alvoPromocao(promocao)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatTipo(promocao)}</TableCell>
                    <TableCell>{formatValor(promocao)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(promocao.inicio_em)} - {formatDate(promocao.fim_em)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={promocao.ativa ? "success" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => void handleToggleAtiva(promocao)}
                      >
                        {promocao.ativa ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(promocao)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => void handleDelete(promocao.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPromocao ? "Editar promocao" : "Nova promocao"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Modelo da promocao</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {modelosPromocao.map((modelo) => {
                  const bloqueado =
                    editingPromocao?.escopo === "VENDA" && modelo.id.startsWith("LEVE");

                  return (
                    <button
                      key={modelo.id}
                      type="button"
                      onClick={() => aplicarModelo(modelo.id)}
                      disabled={bloqueado}
                      className={`rounded-md border p-3 text-left transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-50 ${
                        modeloSelecionado === modelo.id ? "border-primary bg-primary/10" : "bg-background"
                      }`}
                    >
                      <span className="block text-sm font-medium">{modelo.titulo}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">{modelo.descricao}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="escopo">Aplicar em</Label>
              <select
                id="escopo"
                value={formData.escopo}
                disabled={editingPromocao !== null}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    escopo: e.target.value as EscopoPromocao,
                    produto_id: "",
                    categoria_id: "",
                  }))
                }
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option
                  className="bg-background text-foreground"
                  value="VENDA"
                  disabled={formData.tipo_desconto === "LEVE_PAGUE"}
                >
                  Venda inteira
                </option>
                <option className="bg-background text-foreground" value="PRODUTO">Produto</option>
                <option className="bg-background text-foreground" value="CATEGORIA">Categoria</option>
              </select>
            </div>

            {formData.escopo === "PRODUTO" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="produto_id">Produto</Label>
                <select
                  id="produto_id"
                  value={formData.produto_id}
                  disabled={editingPromocao !== null}
                  onChange={(e) => setFormData((prev) => ({ ...prev, produto_id: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option className="bg-background text-foreground" value="">Selecione um produto</option>
                  {produtos.map((produto) => (
                    <option className="bg-background text-foreground" key={produto.id} value={produto.id}>
                      {produto.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.escopo === "CATEGORIA" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="categoria_id">Categoria</Label>
                <select
                  id="categoria_id"
                  value={formData.categoria_id}
                  disabled={editingPromocao !== null}
                  onChange={(e) => setFormData((prev) => ({ ...prev, categoria_id: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option className="bg-background text-foreground" value="">Selecione uma categoria</option>
                  {categorias.map((categoria) => (
                    <option className="bg-background text-foreground" key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              {formData.tipo_desconto === "LEVE_PAGUE" ? (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="quantidade_leve">Leva</Label>
                    <Input
                      id="quantidade_leve"
                      type="number"
                      min="2"
                      step="1"
                      value={formData.quantidade_leve}
                      onChange={(e) => {
                        setModeloSelecionado("LEVE_PAGUE_CUSTOM");
                        setFormData((prev) => ({ ...prev, quantidade_leve: e.target.value }));
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="quantidade_pague">Paga</Label>
                    <Input
                      id="quantidade_pague"
                      type="number"
                      min="1"
                      step="1"
                      value={formData.quantidade_pague}
                      onChange={(e) => {
                        setModeloSelecionado("LEVE_PAGUE_CUSTOM");
                        setFormData((prev) => ({ ...prev, quantidade_pague: e.target.value }));
                      }}
                    />
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="valor">
                    {formData.tipo_desconto === "PERCENTUAL" ? "Percentual" : "Valor"}
                  </Label>
                  <Input
                    id="valor"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => {
                      setModeloSelecionado(
                        formData.tipo_desconto === "PERCENTUAL" && e.target.value === "25"
                          ? "PERCENTUAL_25"
                          : formData.tipo_desconto === "PERCENTUAL"
                            ? "PERCENTUAL_CUSTOM"
                            : "VALOR_FIXO"
                      );
                      setFormData((prev) => ({ ...prev, valor: e.target.value }));
                    }}
                  />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Label htmlFor="inicio_em">Inicio</Label>
                <Input
                  id="inicio_em"
                  type="date"
                  value={formData.inicio_em}
                  onChange={(e) => setFormData((prev) => ({ ...prev, inicio_em: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="fim_em">Fim</Label>
                <Input
                  id="fim_em"
                  type="date"
                  value={formData.fim_em}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fim_em: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={() => void handleSave()} disabled={salvando}>
              {salvando && <Loader2 className="size-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
