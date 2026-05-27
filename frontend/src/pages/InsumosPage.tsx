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
import { Search, Plus, Loader2, Pencil } from "lucide-react";
import {
  atualizarInsumo,
  cadastrarInsumo,
  listarInsumos,
  listarUnidadesMedida,
  type Insumo,
  type UnidadeMedida,
} from "@/servicos/api";
import { formatarQuantidade } from "@/lib/utils";

type InsumoForm = {
  nome: string;
  unidade_medida_id: string;
  custo_unitario: string;
  estoque_inicial: string;
  estoque_minimo: string;
  ativo: boolean;
};

const formInicial: InsumoForm = {
  nome: "",
  unidade_medida_id: "",
  custo_unitario: "",
  estoque_inicial: "0",
  estoque_minimo: "0",
  ativo: true,
};

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none transition-colors focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

export function InsumosPage() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [unidades, setUnidades] = useState<UnidadeMedida[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [formData, setFormData] = useState<InsumoForm>(formInicial);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);

  async function carregarInsumos() {
    setLoading(true);
    try {
      const [insumosDados, unidadesDados] = await Promise.all([
        listarInsumos(),
        listarUnidadesMedida(),
      ]);
      setInsumos(insumosDados);
      setUnidades(unidadesDados);
      setErro("");
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Nao foi possivel carregar os insumos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void carregarInsumos();
    const atualizar = () => void carregarInsumos();
    window.addEventListener("foodflow:data-updated", atualizar);
    return () => window.removeEventListener("foodflow:data-updated", atualizar);
  }, []);

  const unidadesPorId = useMemo(
    () => new Map(unidades.map((unidade) => [unidade.id, unidade])),
    [unidades]
  );

  const filteredInsumos = insumos.filter((i) =>
    i.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const estoqueBaixo = insumos.filter(
    (i) => Number(i.quantidade_estoque) <= Number(i.estoque_minimo)
  ).length;

  const formularioValido =
    formData.nome.trim().length >= 2 &&
    Number(formData.unidade_medida_id) > 0 &&
    formData.custo_unitario.trim() !== "" &&
    Number(formData.custo_unitario) >= 0 &&
    Number(formData.estoque_inicial) >= 0 &&
    Number(formData.estoque_minimo) >= 0;

  const abrirCadastro = () => {
    const primeiraUnidade = unidades.find((unidade) => unidade.ativa);
    setEditingInsumo(null);
    setFormData({
      ...formInicial,
      unidade_medida_id: primeiraUnidade ? String(primeiraUnidade.id) : "",
    });
    setMensagem("");
    setErro("");
    setDialogOpen(true);
  };

  const abrirEdicao = (insumo: Insumo) => {
    setEditingInsumo(insumo);
    setFormData({
      nome: insumo.nome,
      unidade_medida_id: String(insumo.unidade_medida_id),
      custo_unitario: String(insumo.custo_unitario),
      estoque_inicial: String(insumo.quantidade_estoque),
      estoque_minimo: String(insumo.estoque_minimo),
      ativo: insumo.ativo,
    });
    setMensagem("");
    setErro("");
    setDialogOpen(true);
  };

  const salvarInsumo = async () => {
    if (!formularioValido) {
      setMensagem("Informe nome, unidade, custo e estoque validos.");
      return;
    }

    setSalvando(true);
    try {
      const payloadBase = {
        nome: formData.nome.trim(),
        unidade_medida_id: Number(formData.unidade_medida_id),
        custo_unitario: Number(formData.custo_unitario),
        estoque_minimo: Number(formData.estoque_minimo || 0),
      };
      const insumoSalvo = editingInsumo
        ? await atualizarInsumo(editingInsumo.id, {
            ...payloadBase,
            ativo: formData.ativo,
          })
        : await cadastrarInsumo({
            ...payloadBase,
            estoque_inicial: Number(formData.estoque_inicial || 0),
          });

      setInsumos((prev) => {
        const atualizados = editingInsumo
          ? prev.map((insumo) => (insumo.id === insumoSalvo.id ? insumoSalvo : insumo))
          : [...prev, insumoSalvo];
        return atualizados.sort((a, b) => a.nome.localeCompare(b.nome));
      });
      setDialogOpen(false);
      setMensagem(editingInsumo ? "Insumo atualizado com sucesso." : "Insumo cadastrado com sucesso.");
      window.dispatchEvent(new Event("foodflow:data-updated"));
    } catch (falha) {
      setMensagem(falha instanceof Error ? falha.message : "Nao foi possivel salvar o insumo.");
    } finally {
      setSalvando(false);
    }
  };

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
          <Button variant="outline" onClick={() => void carregarInsumos()}>
            Atualizar
          </Button>
          <Button onClick={abrirCadastro} disabled={loading || unidades.length === 0}>
            <Plus className="size-4" />
            Novo Insumo
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
          <CardTitle>Insumos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 size-5 animate-spin" />
              Carregando insumos...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Estoque Atual</TableHead>
                  <TableHead>Estoque Minimo</TableHead>
                  <TableHead>Custo Unit.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInsumos.map((insumo) => (
                  <TableRow key={insumo.id}>
                    <TableCell className="font-medium">{insumo.nome}</TableCell>
                    <TableCell>{unidadesPorId.get(insumo.unidade_medida_id)?.sigla ?? "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          Number(insumo.quantidade_estoque) <= Number(insumo.estoque_minimo)
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {formatarQuantidade(
                          insumo.quantidade_estoque,
                          unidadesPorId.get(insumo.unidade_medida_id)?.sigla
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatarQuantidade(
                        insumo.estoque_minimo,
                        unidadesPorId.get(insumo.unidade_medida_id)?.sigla
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(insumo.custo_unitario)}</TableCell>
                    <TableCell>
                      <Badge variant={insumo.ativo ? "success" : "secondary"}>
                        {insumo.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => abrirEdicao(insumo)}
                        title="Editar insumo"
                      >
                        <Pencil className="size-4" />
                      </Button>
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
            <DialogTitle>{editingInsumo ? "Editar Insumo" : "Novo Insumo"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
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
                <Label htmlFor="unidade">Unidade base</Label>
                <select
                  id="unidade"
                  value={formData.unidade_medida_id}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, unidade_medida_id: e.target.value }))
                  }
                  className={selectClass}
                >
                  <option value="">Selecione</option>
                  {unidades
                    .filter((unidade) => unidade.ativa)
                    .map((unidade) => (
                      <option key={unidade.id} value={unidade.id}>
                        {unidade.nome} ({unidade.sigla})
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="custo">Custo unitario</Label>
                <Input
                  id="custo"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.custo_unitario}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, custo_unitario: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="estoque_inicial">Estoque inicial</Label>
                <Input
                  id="estoque_inicial"
                  type="number"
                  min="0"
                  step="0.001"
                  value={formData.estoque_inicial}
                  disabled={Boolean(editingInsumo)}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, estoque_inicial: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="estoque_minimo">Estoque minimo</Label>
                <Input
                  id="estoque_minimo"
                  type="number"
                  min="0"
                  step="0.001"
                  value={formData.estoque_minimo}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, estoque_minimo: e.target.value }))
                  }
                />
              </div>
              {editingInsumo && (
                <label className="flex items-center gap-2 pt-7 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={formData.ativo}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, ativo: e.target.checked }))
                    }
                  />
                  Insumo ativo
                </label>
              )}
            </div>
            {mensagem && <p className="text-sm text-muted-foreground">{mensagem}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={() => void salvarInsumo()} disabled={salvando || !formularioValido}>
              {salvando && <Loader2 className="size-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
