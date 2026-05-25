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
import { Plus, Pencil, Trash2, Tag, Percent } from "lucide-react";
import type { Promocao } from "@/types";

const promocoesIniciais: Promocao[] = [
  {
    id: 1,
    nome: "Happy Hour",
    descricao: "Desconto especial das 17h às 19h",
    tipo: "percentual",
    valor: 15,
    data_inicio: "2024-01-01",
    data_fim: "2024-12-31",
    ativa: true,
  },
  {
    id: 2,
    nome: "Combo Família",
    descricao: "Leve 4 lanches, pague 3",
    tipo: "leve_pague",
    valor: 4,
    data_inicio: "2024-01-01",
    data_fim: "2024-06-30",
    ativa: true,
  },
  {
    id: 3,
    nome: "Desconto PIX",
    descricao: "Pagando com PIX",
    tipo: "percentual",
    valor: 5,
    data_inicio: "2024-01-01",
    data_fim: "2024-12-31",
    ativa: true,
  },
];

export function PromocoesPage() {
  const [promocoes, setPromocoes] = useState<Promocao[]>(promocoesIniciais);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPromocao, setEditingPromocao] = useState<Promocao | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    tipo: "percentual" as "percentual" | "valor_fixo" | "leve_pague",
    valor: "",
    data_inicio: "",
    data_fim: "",
  });

  const handleOpenDialog = (promocao?: Promocao) => {
    if (promocao) {
      setEditingPromocao(promocao);
      setFormData({
        nome: promocao.nome,
        descricao: promocao.descricao || "",
        tipo: promocao.tipo,
        valor: String(promocao.valor),
        data_inicio: promocao.data_inicio,
        data_fim: promocao.data_fim,
      });
    } else {
      setEditingPromocao(null);
      setFormData({
        nome: "",
        descricao: "",
        tipo: "percentual",
        valor: "",
        data_inicio: "",
        data_fim: "",
      });
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.nome || !formData.valor) return;

    if (editingPromocao) {
      setPromocoes((prev) =>
        prev.map((p) =>
          p.id === editingPromocao.id
            ? {
                ...p,
                nome: formData.nome,
                descricao: formData.descricao,
                tipo: formData.tipo,
                valor: Number(formData.valor),
                data_inicio: formData.data_inicio,
                data_fim: formData.data_fim,
              }
            : p
        )
      );
    } else {
      const newPromocao: Promocao = {
        id: Math.max(...promocoes.map((p) => p.id)) + 1,
        nome: formData.nome,
        descricao: formData.descricao,
        tipo: formData.tipo,
        valor: Number(formData.valor),
        data_inicio: formData.data_inicio,
        data_fim: formData.data_fim,
        ativa: true,
      };
      setPromocoes((prev) => [...prev, newPromocao]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    if (confirm("Deseja realmente excluir esta promoção?")) {
      setPromocoes((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleToggleAtiva = (id: number) => {
    setPromocoes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ativa: !p.ativa } : p))
    );
  };

  const formatTipo = (tipo: string) => {
    switch (tipo) {
      case "percentual":
        return "Percentual";
      case "valor_fixo":
        return "Valor Fixo";
      case "leve_pague":
        return "Leve X Pague Y";
      default:
        return tipo;
    }
  };

  const formatValor = (promocao: Promocao) => {
    switch (promocao.tipo) {
      case "percentual":
        return `${promocao.valor}%`;
      case "valor_fixo":
        return `R$ ${promocao.valor.toFixed(2)}`;
      case "leve_pague":
        return `Leve ${promocao.valor} Pague ${promocao.valor - 1}`;
      default:
        return promocao.valor;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Promoções</h2>
          <p className="text-muted-foreground">Gerencie suas campanhas promocionais</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="size-4" />
          Nova Promoção
        </Button>
      </div>

      {/* Cards de promoções ativas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {promocoes
          .filter((p) => p.ativa)
          .map((promocao) => (
            <Card key={promocao.id} className="relative overflow-hidden">
              <div className="absolute right-0 top-0 rounded-bl-lg bg-primary px-3 py-1">
                <Percent className="size-4 text-primary-foreground" />
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="size-5 text-primary" />
                  {promocao.nome}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-2 text-sm text-muted-foreground">
                  {promocao.descricao}
                </p>
                <div className="mb-2 text-2xl font-bold text-primary">
                  {formatValor(promocao)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Válida até {new Date(promocao.data_fim).toLocaleDateString("pt-BR")}
                </p>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Tabela de todas as promoções */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Promoções</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promocoes.map((promocao) => (
                <TableRow key={promocao.id}>
                  <TableCell className="font-medium">{promocao.nome}</TableCell>
                  <TableCell>{formatTipo(promocao.tipo)}</TableCell>
                  <TableCell>{formatValor(promocao)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(promocao.data_inicio).toLocaleDateString("pt-BR")} -{" "}
                    {new Date(promocao.data_fim).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={promocao.ativa ? "success" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => handleToggleAtiva(promocao.id)}
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
                        onClick={() => handleDelete(promocao.id)}
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
              {editingPromocao ? "Editar Promoção" : "Nova Promoção"}
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
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, descricao: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="tipo">Tipo</Label>
                <select
                  id="tipo"
                  value={formData.tipo}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      tipo: e.target.value as "percentual" | "valor_fixo" | "leve_pague",
                    }))
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  <option value="percentual">Percentual</option>
                  <option value="valor_fixo">Valor Fixo</option>
                  <option value="leve_pague">Leve X Pague Y</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="valor">Valor</Label>
                <Input
                  id="valor"
                  type="number"
                  value={formData.valor}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, valor: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="data_inicio">Data Início</Label>
                <Input
                  id="data_inicio"
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, data_inicio: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="data_fim">Data Fim</Label>
                <Input
                  id="data_fim"
                  type="date"
                  value={formData.data_fim}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, data_fim: e.target.value }))
                  }
                />
              </div>
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
