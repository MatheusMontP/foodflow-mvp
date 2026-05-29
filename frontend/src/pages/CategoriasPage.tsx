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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, FolderOpen } from "lucide-react";
import type { Categoria } from "@/types";

const categoriasIniciais: Categoria[] = [
  { id: 1, nome: "Lanches", descricao: "Produtos principais preparados na cozinha", ativa: true, ordem: 1 },
  { id: 2, nome: "Combos", descricao: "Produto principal com complemento", ativa: true, ordem: 2 },
  { id: 3, nome: "Complementos", descricao: "Batatas, porcoes e acompanhamentos", ativa: true, ordem: 3 },
  { id: 4, nome: "Bebidas", descricao: "Itens de revenda, como refrigerantes e sucos", ativa: true, ordem: 4 },
  { id: 5, nome: "Sobremesas", descricao: "Doces, sorvetes e finalizadores", ativa: true, ordem: 5 },
];

export function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>(categoriasIniciais);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [formData, setFormData] = useState({ nome: "", descricao: "" });

  const handleOpenDialog = (categoria?: Categoria) => {
    if (categoria) {
      setEditingCategoria(categoria);
      setFormData({ nome: categoria.nome, descricao: categoria.descricao || "" });
    } else {
      setEditingCategoria(null);
      setFormData({ nome: "", descricao: "" });
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.nome) return;

    if (editingCategoria) {
      setCategorias((prev) =>
        prev.map((c) =>
          c.id === editingCategoria.id
            ? { ...c, nome: formData.nome, descricao: formData.descricao }
            : c
        )
      );
    } else {
      const newCategoria: Categoria = {
        id: Math.max(...categorias.map((c) => c.id)) + 1,
        nome: formData.nome,
        descricao: formData.descricao,
        ativa: true,
        ordem: categorias.length + 1,
      };
      setCategorias((prev) => [...prev, newCategoria]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    if (confirm("Deseja realmente excluir esta categoria?")) {
      setCategorias((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleToggleAtiva = (id: number) => {
    setCategorias((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ativa: !c.ativa } : c))
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Categorias</h2>
          <p className="text-muted-foreground">Organize seus produtos em categorias</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="size-4" />
          Nova Categoria
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categorias.map((categoria) => (
          <Card key={categoria.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <FolderOpen className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{categoria.nome}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {categoria.descricao || "Sem descricao"}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge
                  variant={categoria.ativa ? "success" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => handleToggleAtiva(categoria.id)}
                >
                  {categoria.ativa ? "Ativa" : "Inativa"}
                </Badge>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(categoria)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleDelete(categoria.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategoria ? "Editar Categoria" : "Nova Categoria"}
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
