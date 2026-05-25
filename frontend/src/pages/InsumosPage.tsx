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
import type { Insumo } from "@/types";

const insumosIniciais: Insumo[] = [
  { id: 1, nome: "Hambúrguer 180g", unidade: "un", estoque_atual: 45, estoque_minimo: 50, custo_unitario: 4.5, ativo: true },
  { id: 2, nome: "Pão de Hambúrguer", unidade: "un", estoque_atual: 120, estoque_minimo: 100, custo_unitario: 1.2, ativo: true },
  { id: 3, nome: "Bacon", unidade: "kg", estoque_atual: 2, estoque_minimo: 5, custo_unitario: 45, ativo: true },
  { id: 4, nome: "Queijo Cheddar", unidade: "kg", estoque_atual: 8, estoque_minimo: 5, custo_unitario: 35, ativo: true },
  { id: 5, nome: "Alface", unidade: "un", estoque_atual: 25, estoque_minimo: 20, custo_unitario: 3, ativo: true },
  { id: 6, nome: "Tomate", unidade: "kg", estoque_atual: 10, estoque_minimo: 8, custo_unitario: 8, ativo: true },
  { id: 7, nome: "Batata Congelada", unidade: "kg", estoque_atual: 15, estoque_minimo: 20, custo_unitario: 12, ativo: true },
  { id: 8, nome: "Óleo de Fritura", unidade: "L", estoque_atual: 20, estoque_minimo: 10, custo_unitario: 9, ativo: true },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function InsumosPage() {
  const [insumos, setInsumos] = useState<Insumo[]>(insumosIniciais);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    unidade: "",
    estoque_minimo: "",
    custo_unitario: "",
  });

  const filteredInsumos = insumos.filter((i) =>
    i.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (insumo?: Insumo) => {
    if (insumo) {
      setEditingInsumo(insumo);
      setFormData({
        nome: insumo.nome,
        unidade: insumo.unidade,
        estoque_minimo: String(insumo.estoque_minimo),
        custo_unitario: String(insumo.custo_unitario),
      });
    } else {
      setEditingInsumo(null);
      setFormData({ nome: "", unidade: "", estoque_minimo: "", custo_unitario: "" });
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.nome || !formData.unidade) return;

    if (editingInsumo) {
      setInsumos((prev) =>
        prev.map((i) =>
          i.id === editingInsumo.id
            ? {
                ...i,
                nome: formData.nome,
                unidade: formData.unidade,
                estoque_minimo: Number(formData.estoque_minimo),
                custo_unitario: Number(formData.custo_unitario),
              }
            : i
        )
      );
    } else {
      const newInsumo: Insumo = {
        id: Math.max(...insumos.map((i) => i.id)) + 1,
        nome: formData.nome,
        unidade: formData.unidade,
        estoque_atual: 0,
        estoque_minimo: Number(formData.estoque_minimo),
        custo_unitario: Number(formData.custo_unitario),
        ativo: true,
      };
      setInsumos((prev) => [...prev, newInsumo]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    if (confirm("Deseja realmente excluir este insumo?")) {
      setInsumos((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const estoqueBaixo = insumos.filter((i) => i.estoque_atual < i.estoque_minimo).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar insumo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-4">
          {estoqueBaixo > 0 && (
            <Badge variant="warning">{estoqueBaixo} com estoque baixo</Badge>
          )}
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="size-4" />
            Novo Insumo
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Insumos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Estoque Atual</TableHead>
                <TableHead>Estoque Mínimo</TableHead>
                <TableHead>Custo Unit.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInsumos.map((insumo) => (
                <TableRow key={insumo.id}>
                  <TableCell className="font-medium">{insumo.nome}</TableCell>
                  <TableCell>{insumo.unidade}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        insumo.estoque_atual < insumo.estoque_minimo
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {insumo.estoque_atual}
                    </Badge>
                  </TableCell>
                  <TableCell>{insumo.estoque_minimo}</TableCell>
                  <TableCell>{formatCurrency(insumo.custo_unitario)}</TableCell>
                  <TableCell>
                    <Badge variant={insumo.ativo ? "success" : "secondary"}>
                      {insumo.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(insumo)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDelete(insumo.id)}
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
              {editingInsumo ? "Editar Insumo" : "Novo Insumo"}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="unidade">Unidade</Label>
                <Input
                  id="unidade"
                  placeholder="un, kg, L..."
                  value={formData.unidade}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, unidade: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="estoque_minimo">Estoque Mínimo</Label>
                <Input
                  id="estoque_minimo"
                  type="number"
                  value={formData.estoque_minimo}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      estoque_minimo: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="custo_unitario">Custo Unitário</Label>
              <Input
                id="custo_unitario"
                type="number"
                step="0.01"
                value={formData.custo_unitario}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    custo_unitario: e.target.value,
                  }))
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
