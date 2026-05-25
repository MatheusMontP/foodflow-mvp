import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, ArrowUpCircle, ArrowDownCircle, AlertTriangle, Package } from "lucide-react";

interface MovimentacaoEstoque {
  id: number;
  insumo: string;
  tipo: "entrada" | "saida";
  quantidade: number;
  motivo: string;
  data: string;
}

const movimentacoes: MovimentacaoEstoque[] = [
  { id: 1, insumo: "Hambúrguer 180g", tipo: "entrada", quantidade: 100, motivo: "Compra fornecedor", data: "2024-01-15" },
  { id: 2, insumo: "Bacon", tipo: "saida", quantidade: 3, motivo: "Uso produção", data: "2024-01-15" },
  { id: 3, insumo: "Pão de Hambúrguer", tipo: "entrada", quantidade: 200, motivo: "Compra fornecedor", data: "2024-01-14" },
  { id: 4, insumo: "Batata Congelada", tipo: "saida", quantidade: 5, motivo: "Uso produção", data: "2024-01-14" },
  { id: 5, insumo: "Queijo Cheddar", tipo: "entrada", quantidade: 10, motivo: "Compra fornecedor", data: "2024-01-13" },
];

const alertasEstoque = [
  { nome: "Hambúrguer 180g", atual: 45, minimo: 50 },
  { nome: "Bacon", atual: 2, minimo: 5 },
  { nome: "Batata Congelada", atual: 15, minimo: 20 },
];

export function EstoquePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tipoMovimentacao, setTipoMovimentacao] = useState<"entrada" | "saida">("entrada");
  const [formData, setFormData] = useState({
    insumo: "",
    quantidade: "",
    motivo: "",
  });

  const filteredMovimentacoes = movimentacoes.filter((m) =>
    m.insumo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (tipo: "entrada" | "saida") => {
    setTipoMovimentacao(tipo);
    setFormData({ insumo: "", quantidade: "", motivo: "" });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.insumo || !formData.quantidade) return;
    alert(`Movimentação de ${tipoMovimentacao} registrada!`);
    setDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Cards de resumo */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Entradas Hoje</CardTitle>
            <ArrowUpCircle className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">movimentações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saídas Hoje</CardTitle>
            <ArrowDownCircle className="size-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">34</div>
            <p className="text-xs text-muted-foreground">movimentações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alertas</CardTitle>
            <AlertTriangle className="size-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertasEstoque.length}</div>
            <p className="text-xs text-muted-foreground">abaixo do mínimo</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="movimentacoes">
        <TabsList>
          <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
          <TabsTrigger value="alertas">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="movimentacoes" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Histórico de Movimentações</CardTitle>
                  <CardDescription>Entradas e saídas de estoque</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleOpenDialog("entrada")}>
                    <ArrowUpCircle className="size-4 text-green-500" />
                    Entrada
                  </Button>
                  <Button variant="outline" onClick={() => handleOpenDialog("saida")}>
                    <ArrowDownCircle className="size-4 text-red-500" />
                    Saída
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative max-w-xs">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Insumo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovimentacoes.map((mov) => (
                    <TableRow key={mov.id}>
                      <TableCell>{new Date(mov.data).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="font-medium">{mov.insumo}</TableCell>
                      <TableCell>
                        <Badge variant={mov.tipo === "entrada" ? "success" : "destructive"}>
                          {mov.tipo === "entrada" ? "Entrada" : "Saída"}
                        </Badge>
                      </TableCell>
                      <TableCell>{mov.quantidade}</TableCell>
                      <TableCell className="text-muted-foreground">{mov.motivo}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alertas" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-yellow-500" />
                Insumos com Estoque Baixo
              </CardTitle>
              <CardDescription>Itens que precisam de reposição urgente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {alertasEstoque.map((item) => (
                  <div
                    key={item.nome}
                    className="flex items-center justify-between rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="size-8 text-yellow-500" />
                      <div>
                        <p className="font-medium">{item.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          Mínimo recomendado: {item.minimo}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-yellow-500">{item.atual}</p>
                      <p className="text-xs text-muted-foreground">em estoque</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Registrar {tipoMovimentacao === "entrada" ? "Entrada" : "Saída"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="insumo">Insumo</Label>
              <Input
                id="insumo"
                value={formData.insumo}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, insumo: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input
                id="quantidade"
                type="number"
                value={formData.quantidade}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, quantidade: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="motivo">Motivo</Label>
              <Input
                id="motivo"
                value={formData.motivo}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, motivo: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
