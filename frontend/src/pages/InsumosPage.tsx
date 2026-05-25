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
import { Search, Plus, Loader2 } from "lucide-react";
import { listarInsumos, listarUnidadesMedida, type Insumo, type UnidadeMedida } from "@/servicos/api";

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
  const [erro, setErro] = useState("");

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
          <Button disabled title="Cadastro completo fica no bloco de cadastros base">
            <Plus className="size-4" />
            Novo Insumo
          </Button>
        </div>
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

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
                        {insumo.quantidade_estoque}
                      </Badge>
                    </TableCell>
                    <TableCell>{insumo.estoque_minimo}</TableCell>
                    <TableCell>{formatCurrency(insumo.custo_unitario)}</TableCell>
                    <TableCell>
                      <Badge variant={insumo.ativo ? "success" : "secondary"}>
                        {insumo.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
