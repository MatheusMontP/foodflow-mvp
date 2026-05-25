import { useEffect, useMemo, useState } from "react";
import { useCartStore } from "@/stores/cart-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  QrCode,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import type { Categoria, Produto } from "@/types";
import {
  consultarCardapioPDV,
  finalizarVenda,
  type Categoria as CategoriaApi,
  type FormaPagamento,
  type Produto as ProdutoApi,
} from "@/servicos/api";

type ProdutoPDV = Produto & {
  vendavel: boolean;
  motivo_indisponibilidade?: string | null;
};

const formasPagamento: { label: string; api: FormaPagamento; icon: typeof Banknote }[] = [
  { label: "Dinheiro", api: "DINHEIRO", icon: Banknote },
  { label: "Cartao", api: "CARTAO_DEBITO", icon: CreditCard },
  { label: "PIX", api: "PIX", icon: QrCode },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function mapCategoria(categoria: CategoriaApi): Categoria {
  return {
    id: categoria.id,
    nome: categoria.nome,
    descricao: categoria.descricao ?? undefined,
    ativa: categoria.ativo,
  };
}

function mapProduto(produto: ProdutoApi): ProdutoPDV {
  return {
    id: produto.id,
    nome: produto.nome,
    descricao: produto.descricao ?? undefined,
    preco: Number(produto.preco_venda),
    categoria_id: produto.categoria_id,
    ativo: produto.status === "ATIVO",
    vendavel: produto.vendavel,
    motivo_indisponibilidade: produto.motivo_indisponibilidade,
  };
}

export function PDVPage() {
  const { items, addItem, updateQuantidade, removeItem, clearCart, getTotal } =
    useCartStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [produtos, setProdutos] = useState<ProdutoPDV[]>([]);
  const [loading, setLoading] = useState(true);
  const [finalizando, setFinalizando] = useState<FormaPagamento | null>(null);
  const [mensagem, setMensagem] = useState("");

  async function carregarCardapio() {
    setLoading(true);
    try {
      const cardapio = await consultarCardapioPDV();
      setCategorias(cardapio.categorias.map(mapCategoria));
      setProdutos(cardapio.produtos.map(mapProduto));
      setMensagem("");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel carregar o cardapio.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void carregarCardapio();
  }, []);

  const filteredProducts = useMemo(
    () =>
      produtos.filter((produto) => {
        const matchesSearch = produto.nome.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory =
          selectedCategory === "all" || produto.categoria_id === Number(selectedCategory);
        return matchesSearch && matchesCategory;
      }),
    [produtos, searchTerm, selectedCategory]
  );

  async function handleFinalizarVenda(formaPagamento: FormaPagamento) {
    if (items.length === 0) {
      setMensagem("Adicione produtos ao carrinho.");
      return;
    }

    setFinalizando(formaPagamento);
    setMensagem("");

    try {
      const venda = await finalizarVenda({
        forma_pagamento: formaPagamento,
        itens: items.map((item) => ({
          produto_id: item.produto.id,
          quantidade: item.quantidade,
          adicional_ids: item.adicionais.flatMap((adicional) =>
            Array.from({ length: adicional.quantidade }, () => adicional.adicional.id)
          ),
          remocao_item_ficha_tecnica_ids: [],
          observacao: item.observacao,
        })),
      });

      clearCart();
      await carregarCardapio();
      window.dispatchEvent(new Event("foodflow:data-updated"));
      setMensagem(`Venda ${venda.numero_pedido} finalizada. Total: ${formatCurrency(Number(venda.total))}`);
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel finalizar a venda.");
    } finally {
      setFinalizando(null);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      <div className="flex flex-1 flex-col gap-4 overflow-hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="all">Todos</TabsTrigger>
            {categorias.map((cat) => (
              <TabsTrigger key={cat.id} value={String(cat.id)}>
                {cat.nome}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 size-5 animate-spin" />
              Carregando cardapio...
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filteredProducts.map((produto) => (
                <button
                  key={produto.id}
                  onClick={() => addItem(produto)}
                  disabled={!produto.vendavel || finalizando !== null}
                  title={produto.motivo_indisponibilidade ?? "Adicionar ao carrinho"}
                  className="flex min-h-40 flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center transition-all hover:border-primary hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex size-16 items-center justify-center rounded-lg bg-primary/10">
                    <ShoppingCart className="size-8 text-primary" />
                  </div>
                  <span className="line-clamp-2 text-sm font-medium">{produto.nome}</span>
                  <Badge variant="secondary">{formatCurrency(produto.preco)}</Badge>
                  {!produto.vendavel && (
                    <span className="text-xs text-destructive">
                      {produto.motivo_indisponibilidade ?? "Indisponivel"}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Card className="flex w-80 flex-col lg:w-96">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="size-5" />
            Carrinho
            {items.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {items.length} itens
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                <ShoppingCart className="mb-2 size-12 opacity-20" />
                <p>Carrinho vazio</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex-1">
                      <p className="font-medium">{item.produto.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.produto.preco)} cada
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => updateQuantidade(item.id, item.quantidade - 1)}
                        disabled={finalizando !== null}
                      >
                        <Minus className="size-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantidade}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => updateQuantidade(item.id, item.quantidade + 1)}
                        disabled={finalizando !== null}
                      >
                        <Plus className="size-3" />
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive"
                      onClick={() => removeItem(item.id)}
                      disabled={finalizando !== null}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <div className="mb-4 flex items-center justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(getTotal())}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {formasPagamento.map((forma) => (
                <Button
                  key={forma.api}
                  variant="outline"
                  className="flex h-auto flex-col gap-1 py-3"
                  onClick={() => void handleFinalizarVenda(forma.api)}
                  disabled={items.length === 0 || finalizando !== null}
                >
                  {finalizando === forma.api ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <forma.icon className="size-5" />
                  )}
                  <span className="text-xs">{forma.label}</span>
                </Button>
              ))}
            </div>

            {items.length > 0 && (
              <Button
                variant="ghost"
                className="mt-2 w-full text-destructive"
                onClick={clearCart}
                disabled={finalizando !== null}
              >
                Limpar Carrinho
              </Button>
            )}

            {mensagem && <p className="mt-3 text-sm text-muted-foreground">{mensagem}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
