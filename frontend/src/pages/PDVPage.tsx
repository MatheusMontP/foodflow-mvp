import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  QrCode,
  ShoppingCart,
} from "lucide-react";
import type { Produto, Categoria } from "@/types";

// Dados de exemplo
const categorias: Categoria[] = [
  { id: 1, nome: "Lanches", ativa: true },
  { id: 2, nome: "Porções", ativa: true },
  { id: 3, nome: "Bebidas", ativa: true },
  { id: 4, nome: "Sobremesas", ativa: true },
];

const produtos: Produto[] = [
  { id: 1, nome: "X-Bacon", preco: 22.9, categoria_id: 1, ativo: true },
  { id: 2, nome: "X-Tudo", preco: 26.9, categoria_id: 1, ativo: true },
  { id: 3, nome: "X-Salada", preco: 18.9, categoria_id: 1, ativo: true },
  { id: 4, nome: "X-Egg", preco: 19.9, categoria_id: 1, ativo: true },
  { id: 5, nome: "Hambúrguer Simples", preco: 14.9, categoria_id: 1, ativo: true },
  { id: 6, nome: "Batata Frita P", preco: 12.9, categoria_id: 2, ativo: true },
  { id: 7, nome: "Batata Frita M", preco: 16.9, categoria_id: 2, ativo: true },
  { id: 8, nome: "Batata Frita G", preco: 22.9, categoria_id: 2, ativo: true },
  { id: 9, nome: "Onion Rings", preco: 18.9, categoria_id: 2, ativo: true },
  { id: 10, nome: "Coca-Cola Lata", preco: 6.9, categoria_id: 3, ativo: true },
  { id: 11, nome: "Guaraná Lata", preco: 6.9, categoria_id: 3, ativo: true },
  { id: 12, nome: "Suco Natural", preco: 9.9, categoria_id: 3, ativo: true },
  { id: 13, nome: "Água Mineral", preco: 4.9, categoria_id: 3, ativo: true },
  { id: 14, nome: "Milk Shake", preco: 16.9, categoria_id: 4, ativo: true },
  { id: 15, nome: "Sundae", preco: 12.9, categoria_id: 4, ativo: true },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function PDVPage() {
  const { items, addItem, updateQuantidade, removeItem, clearCart, getTotal } =
    useCartStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredProducts = produtos.filter((produto) => {
    const matchesSearch = produto.nome
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      produto.categoria_id === Number(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const handleFinalizarVenda = (formaPagamento: string) => {
    if (items.length === 0) {
      alert("Adicione produtos ao carrinho");
      return;
    }

    alert(`Venda finalizada!\nForma de pagamento: ${formaPagamento}\nTotal: ${formatCurrency(getTotal())}`);
    clearCart();
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Produtos */}
      <div className="flex flex-1 flex-col gap-4 overflow-hidden">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Categorias */}
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

        {/* Grid de produtos */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((produto) => (
              <button
                key={produto.id}
                onClick={() => addItem(produto)}
                className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center transition-all hover:border-primary hover:shadow-lg active:scale-95"
              >
                <div className="flex size-16 items-center justify-center rounded-lg bg-primary/10">
                  <ShoppingCart className="size-8 text-primary" />
                </div>
                <span className="line-clamp-2 text-sm font-medium">
                  {produto.nome}
                </span>
                <Badge variant="secondary">{formatCurrency(produto.preco)}</Badge>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Carrinho */}
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
          {/* Lista de itens */}
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                <ShoppingCart className="mb-2 size-12 opacity-20" />
                <p>Carrinho vazio</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
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
                        onClick={() =>
                          updateQuantidade(item.id, item.quantidade - 1)
                        }
                      >
                        <Minus className="size-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {item.quantidade}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() =>
                          updateQuantidade(item.id, item.quantidade + 1)
                        }
                      >
                        <Plus className="size-3" />
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total e botões de pagamento */}
          <div className="border-t pt-4">
            <div className="mb-4 flex items-center justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(getTotal())}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className="flex flex-col gap-1 h-auto py-3"
                onClick={() => handleFinalizarVenda("Dinheiro")}
                disabled={items.length === 0}
              >
                <Banknote className="size-5" />
                <span className="text-xs">Dinheiro</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col gap-1 h-auto py-3"
                onClick={() => handleFinalizarVenda("Cartão")}
                disabled={items.length === 0}
              >
                <CreditCard className="size-5" />
                <span className="text-xs">Cartão</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col gap-1 h-auto py-3"
                onClick={() => handleFinalizarVenda("PIX")}
                disabled={items.length === 0}
              >
                <QrCode className="size-5" />
                <span className="text-xs">PIX</span>
              </Button>
            </div>

            {items.length > 0 && (
              <Button
                variant="ghost"
                className="mt-2 w-full text-destructive"
                onClick={clearCart}
              >
                Limpar Carrinho
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
