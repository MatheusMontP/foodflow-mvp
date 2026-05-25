import { useState } from "react";
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
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import type { Produto } from "@/types";

const produtosIniciais: Produto[] = [
  { id: 1, nome: "X-Bacon", preco: 22.9, categoria_id: 1, ativo: true, descricao: "Hambúrguer com bacon crocante" },
  { id: 2, nome: "X-Tudo", preco: 26.9, categoria_id: 1, ativo: true, descricao: "O mais completo da casa" },
  { id: 3, nome: "X-Salada", preco: 18.9, categoria_id: 1, ativo: true, descricao: "Opção mais leve" },
  { id: 4, nome: "Batata Frita G", preco: 22.9, categoria_id: 2, ativo: true, descricao: "Porção grande" },
  { id: 5, nome: "Coca-Cola Lata", preco: 6.9, categoria_id: 3, ativo: true },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>(produtosIniciais);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    preco: "",
    descricao: "",
  });

  const filteredProducts = produtos.filter((p) =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (produto?: Produto) => {
    if (produto) {
      setEditingProduct(produto);
      setFormData({
        nome: produto.nome,
        preco: String(produto.preco),
        descricao: produto.descricao || "",
      });
    } else {
      setEditingProduct(null);
      setFormData({ nome: "", preco: "", descricao: "" });
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.nome || !formData.preco) return;

    if (editingProduct) {
      setProdutos((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? { ...p, nome: formData.nome, preco: Number(formData.preco), descricao: formData.descricao }
            : p
        )
      );
    } else {
      const newProduct: Produto = {
        id: Math.max(...produtos.map((p) => p.id)) + 1,
        nome: formData.nome,
        preco: Number(formData.preco),
        descricao: formData.descricao,
        categoria_id: 1,
        ativo: true,
      };
      setProdutos((prev) => [...prev, newProduct]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    if (confirm("Deseja realmente excluir este produto?")) {
      setProdutos((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleToggleAtivo = (id: number) => {
    setProdutos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ativo: !p.ativo } : p))
    );
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
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="size-4" />
          Novo Produto
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Produtos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((produto) => (
                <TableRow key={produto.id}>
                  <TableCell className="font-medium">{produto.nome}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {produto.descricao || "-"}
                  </TableCell>
                  <TableCell>{formatCurrency(produto.preco)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={produto.ativo ? "success" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => handleToggleAtivo(produto.id)}
                    >
                      {produto.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(produto)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDelete(produto.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
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
              <Label htmlFor="preco">Preço</Label>
              <Input
                id="preco"
                type="number"
                step="0.01"
                value={formData.preco}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, preco: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, descricao: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
