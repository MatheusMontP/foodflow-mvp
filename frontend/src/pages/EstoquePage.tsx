import { useEffect, useMemo, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ArrowUpCircle, ArrowDownCircle, AlertTriangle, Package, Loader2 } from "lucide-react";
import {
  listarInsumos,
  listarMovimentacoesEstoque,
  listarUnidadesMedida,
  type Insumo,
  type MovimentacaoEstoque,
  type UnidadeMedida,
} from "@/servicos/api";
import { formatarQuantidade } from "@/lib/utils";

function tipoLabel(tipo: MovimentacaoEstoque["tipo"]) {
  const labels = {
    ENTRADA: "Entrada",
    SAIDA_VENDA: "Saida por venda",
    AJUSTE_MANUAL: "Ajuste",
    PERDA_DESPERDICIO: "Perda",
    DEVOLUCAO_CANCELAMENTO: "Devolucao",
  };
  return labels[tipo];
}

export function EstoquePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [unidades, setUnidades] = useState<UnidadeMedida[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarEstoque() {
    setLoading(true);
    try {
      const [movimentacoesDados, insumosDados, unidadesDados] = await Promise.all([
        listarMovimentacoesEstoque(),
        listarInsumos(),
        listarUnidadesMedida(),
      ]);
      setMovimentacoes(movimentacoesDados);
      setInsumos(insumosDados);
      setUnidades(unidadesDados);
      setErro("");
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Nao foi possivel carregar o estoque.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void carregarEstoque();
    const atualizar = () => void carregarEstoque();
    window.addEventListener("foodflow:data-updated", atualizar);
    return () => window.removeEventListener("foodflow:data-updated", atualizar);
  }, []);

  const insumosPorId = useMemo(
    () => new Map(insumos.map((insumo) => [insumo.id, insumo])),
    [insumos]
  );

  const unidadesPorId = useMemo(
    () => new Map(unidades.map((unidade) => [unidade.id, unidade])),
    [unidades]
  );

  const siglaPorInsumo = (insumoId: number) => {
    const insumo = insumosPorId.get(insumoId);
    return insumo ? unidadesPorId.get(insumo.unidade_medida_id)?.sigla : undefined;
  };

  const filteredMovimentacoes = movimentacoes.filter((movimentacao) => {
    const insumo = insumosPorId.get(movimentacao.insumo_id);
    return (insumo?.nome ?? String(movimentacao.insumo_id))
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
  });

  const alertasEstoque = insumos.filter(
    (insumo) => Number(insumo.quantidade_estoque) <= Number(insumo.estoque_minimo)
  );
  const entradasHoje = movimentacoes.filter((mov) => mov.tipo === "ENTRADA").length;
  const saidasHoje = movimentacoes.filter((mov) => mov.tipo === "SAIDA_VENDA").length;

  return (
    <div className="flex flex-col gap-6">
      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Entradas</CardTitle>
            <ArrowUpCircle className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entradasHoje}</div>
            <p className="text-xs text-muted-foreground">movimentacoes registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saidas por Venda</CardTitle>
            <ArrowDownCircle className="size-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{saidasHoje}</div>
            <p className="text-xs text-muted-foreground">baixas automaticas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alertas</CardTitle>
            <AlertTriangle className="size-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertasEstoque.length}</div>
            <p className="text-xs text-muted-foreground">abaixo do minimo</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="movimentacoes">
        <TabsList>
          <TabsTrigger value="movimentacoes">Movimentacoes</TabsTrigger>
          <TabsTrigger value="alertas">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="movimentacoes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Historico de Movimentacoes</CardTitle>
              <CardDescription>Entradas, ajustes, perdas e baixas geradas por venda</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-3">
                <div className="relative max-w-xs flex-1">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" onClick={() => void carregarEstoque()}>
                  Atualizar
                </Button>
              </div>

              {loading ? (
                <div className="flex h-40 items-center justify-center text-muted-foreground">
                  <Loader2 className="mr-2 size-5 animate-spin" />
                  Carregando estoque...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Insumo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Antes</TableHead>
                      <TableHead>Depois</TableHead>
                      <TableHead>Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMovimentacoes.map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell>{new Date(mov.criado_em).toLocaleString("pt-BR")}</TableCell>
                        <TableCell className="font-medium">
                          {insumosPorId.get(mov.insumo_id)?.nome ?? mov.insumo_id}
                        </TableCell>
                        <TableCell>
                          <Badge variant={mov.tipo === "ENTRADA" ? "success" : "secondary"}>
                            {tipoLabel(mov.tipo)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatarQuantidade(mov.quantidade, siglaPorInsumo(mov.insumo_id))}
                        </TableCell>
                        <TableCell>
                          {formatarQuantidade(mov.estoque_antes, siglaPorInsumo(mov.insumo_id))}
                        </TableCell>
                        <TableCell>
                          {formatarQuantidade(mov.estoque_depois, siglaPorInsumo(mov.insumo_id))}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{mov.motivo ?? "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
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
              <CardDescription>Atualizado diretamente do banco</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {alertasEstoque.length > 0 ? (
                  alertasEstoque.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <Package className="size-8 text-yellow-500" />
                        <div>
                          <p className="font-medium">{item.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            Minimo recomendado:{" "}
                            {formatarQuantidade(
                              item.estoque_minimo,
                              unidadesPorId.get(item.unidade_medida_id)?.sigla
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-yellow-500">
                          {formatarQuantidade(
                            item.quantidade_estoque,
                            unidadesPorId.get(item.unidade_medida_id)?.sigla
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">em estoque</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum insumo abaixo do minimo.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
