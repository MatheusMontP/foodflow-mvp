import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  BadgeDollarSign,
  CirclePlus,
  History,
  Loader2,
  Megaphone,
  PackageCheck,
  Percent,
  SlidersHorizontal,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  gerarRecomendacao,
  listarRecomendacoes,
  type ItemRecomendacao,
  type Recomendacao,
} from "@/servicos/api";

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

function formatLimitantes(value?: string) {
  if (!value) return "Nenhum";
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .join(", ");
}

function calcularLucroItem(item: ItemRecomendacao) {
  return Number(item.lucro_unitario) * item.quantidade_recomendada;
}

function getProdutoNome(item: ItemRecomendacao) {
  return item.produto_nome ?? `Produto ${item.produto_id}`;
}

function getDescontoSeguroTexto(item?: ItemRecomendacao) {
  if (!item || Number(item.desconto_seguro_valor ?? 0) <= 0) return "Sem folga segura";
  return `${formatCurrency(item.desconto_seguro_valor ?? 0)} (${Number(
    item.desconto_seguro_percentual ?? 0
  ).toLocaleString("pt-BR")}%)`;
}

export function RecomendacoesPage() {
  const [recomendacoes, setRecomendacoes] = useState<Recomendacao[]>([]);
  const [capacidadeDiaria, setCapacidadeDiaria] = useState("150");
  const [periodoRecomendado, setPeriodoRecomendado] = useState("Hoje");
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function carregarRecomendacoes() {
    setLoading(true);
    try {
      const dados = await listarRecomendacoes();
      setRecomendacoes(dados);
      setMensagem("");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel carregar recomendacoes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void carregarRecomendacoes();
  }, []);

  const ultimaRecomendacao = recomendacoes[0];

  const itensOrdenados = useMemo(
    () =>
      [...(ultimaRecomendacao?.itens ?? [])].sort(
        (a, b) => {
          const tipoA = a.tipo_recomendacao === "COMPLEMENTO" ? 1 : 0;
          const tipoB = b.tipo_recomendacao === "COMPLEMENTO" ? 1 : 0;
          if (tipoA !== tipoB) return tipoA - tipoB;
          return calcularLucroItem(b) - calcularLucroItem(a);
        }
      ),
    [ultimaRecomendacao]
  );

  const produtoPrincipal = itensOrdenados.find((item) => item.tipo_recomendacao !== "COMPLEMENTO") ?? itensOrdenados[0];
  const complementoPrincipal = itensOrdenados.find((item) => item.tipo_recomendacao === "COMPLEMENTO");

  const totalItensRecomendados = useMemo(
    () => itensOrdenados.reduce((total, item) => total + item.quantidade_recomendada, 0),
    [itensOrdenados]
  );

  const capacidadeUsadaPercentual = ultimaRecomendacao?.capacidade_total
    ? Math.round((ultimaRecomendacao.capacidade_usada / ultimaRecomendacao.capacidade_total) * 100)
    : 0;

  async function handleGerarRecomendacao() {
    const capacidade = Number(capacidadeDiaria);
    if (!Number.isInteger(capacidade) || capacidade <= 0) {
      setMensagem("Informe uma capacidade diaria valida.");
      return;
    }

    setGerando(true);
    try {
      const nova = await gerarRecomendacao({
        capacidade_diaria: capacidade,
        dias_analise_demanda: 7,
        periodo_recomendado: periodoRecomendado.trim() || "Hoje",
      });
      setRecomendacoes((prev) => [nova, ...prev]);
      setMensagem("Plano de venda e producao atualizado.");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel gerar a recomendacao.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Produtos para priorizar</h2>
          <p className="text-muted-foreground">
            Plano de venda e producao baseado em estoque, demanda e margem de lucro
          </p>
        </div>
        <Button onClick={() => void handleGerarRecomendacao()} disabled={gerando}>
          {gerando ? <Loader2 className="size-4 animate-spin" /> : <CirclePlus className="size-4" />}
          Gerar plano
        </Button>
      </div>

      {mensagem && <p className="text-sm text-muted-foreground">{mensagem}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Produto destaque</CardTitle>
            <Megaphone className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="truncate text-2xl font-bold">
              {produtoPrincipal ? getProdutoNome(produtoPrincipal) : "-"}
            </div>
            <p className="text-xs text-muted-foreground">melhor prioridade da recomendacao atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lucro estimado</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(ultimaRecomendacao?.lucro_estimado ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">potencial do plano recomendado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Itens para preparar</CardTitle>
            <PackageCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItensRecomendados}</div>
            <p className="text-xs text-muted-foreground">quantidade total sugerida</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Capacidade usada</CardTitle>
            <Target className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{capacidadeUsadaPercentual}%</div>
            <p className="text-xs text-muted-foreground">
              {ultimaRecomendacao?.capacidade_usada ?? 0}/{ultimaRecomendacao?.capacidade_total ?? Number(capacidadeDiaria)} unidades
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="size-5" />
            Gerar recomendacao
          </CardTitle>
          <CardDescription>Defina o volume que a cozinha consegue atender e gere uma lista de prioridades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-[180px_1fr_auto] sm:items-end">
            <div className="flex flex-col gap-2">
              <Label htmlFor="capacidade">Capacidade diaria</Label>
              <Input
                id="capacidade"
                type="number"
                min="1"
                value={capacidadeDiaria}
                onChange={(event) => setCapacidadeDiaria(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="periodo">Periodo</Label>
              <Input
                id="periodo"
                value={periodoRecomendado}
                onChange={(event) => setPeriodoRecomendado(event.target.value)}
              />
            </div>
            <Button onClick={() => void handleGerarRecomendacao()} disabled={gerando}>
              {gerando ? <Loader2 className="size-4 animate-spin" /> : <CirclePlus className="size-4" />}
              Atualizar plano
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prioridade de venda</CardTitle>
          <CardDescription>
            {ultimaRecomendacao
              ? `Plano gerado em ${formatDate(ultimaRecomendacao.criado_em)} para ${ultimaRecomendacao.periodo_recomendado}`
              : "Gere uma recomendacao para visualizar quais produtos priorizar"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-44 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 size-5 animate-spin" />
              Carregando recomendacoes...
            </div>
          ) : ultimaRecomendacao && itensOrdenados.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {itensOrdenados.map((item, index) => {
                const lucroTotal = calcularLucroItem(item);
                return (
                  <div key={item.id} className="rounded-md border p-4">
                    <div className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Badge variant={index === 0 ? "default" : "secondary"}>
                            {item.tipo_recomendacao === "COMPLEMENTO" ? "Complemento" : `Prioridade ${index + 1}`}
                          </Badge>
                          <h3 className="mt-3 truncate text-xl font-semibold">{getProdutoNome(item)}</h3>
                        </div>
                        <BadgeDollarSign className="size-5 shrink-0 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="text-3xl font-bold">{item.quantidade_recomendada} un</div>
                        <p className="text-sm text-muted-foreground">
                          {item.tipo_recomendacao === "COMPLEMENTO"
                            ? "oferecer como combo junto ao produto principal"
                            : "preparar e incentivar no atendimento"}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Lucro unitario</p>
                          <p className="font-medium">{formatCurrency(item.lucro_unitario)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Lucro previsto</p>
                          <p className="font-medium">{formatCurrency(lucroTotal)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Demanda usada</p>
                          <p className="font-medium">{item.demanda_considerada} un</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Acao</p>
                          <p className="font-medium">{item.acao_sugerida ?? "Destacar no PDV"}</p>
                        </div>
                        <div className="col-span-2 rounded-md bg-muted/40 p-3">
                          <p className="text-muted-foreground">Desconto seguro</p>
                          <p className="font-medium">{getDescontoSeguroTexto(item)}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            margem para promocao mantendo vantagem sobre o proximo produto
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-44 flex-col items-center justify-center gap-2 text-muted-foreground">
              <AlertTriangle className="size-8 opacity-40" />
              <p className="text-sm">Ainda nao existe um plano de recomendacao.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {ultimaRecomendacao && (
        <Card>
          <CardHeader>
            <CardTitle>Leitura do plano</CardTitle>
            <CardDescription>Resumo para decidir o que vender primeiro e onde tomar cuidado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 lg:grid-cols-4">
              <div className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">Produto a incentivar</p>
                <p className="mt-1 text-lg font-semibold">
                  {produtoPrincipal ? getProdutoNome(produtoPrincipal) : "-"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Comece por ele no atendimento, pois combina margem e viabilidade de estoque.
                </p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">Complemento para combo</p>
                <p className="mt-1 text-lg font-semibold">
                  {complementoPrincipal ? getProdutoNome(complementoPrincipal) : "Sem complemento"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Use como aumento de ticket, nao como produto principal da campanha.
                </p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">Desconto seguro</p>
                <p className="mt-1 flex items-center gap-2 text-lg font-semibold">
                  <Percent className="size-4 text-muted-foreground" />
                  {getDescontoSeguroTexto(produtoPrincipal)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Pode incentivar sem perder a vantagem de margem sobre os demais itens.
                </p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">Insumos limitantes</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatLimitantes(ultimaRecomendacao.insumos_limitantes)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Se quiser vender mais, esses itens devem ser conferidos no estoque.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {ultimaRecomendacao && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do calculo</CardTitle>
            <CardDescription>Base tecnica mantida para explicar a programacao linear na apresentacao</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge variant="secondary">Confianca {ultimaRecomendacao.fator_confianca}/10</Badge>
              <Badge variant="secondary">Periodo: {ultimaRecomendacao.periodo_recomendado}</Badge>
              <Badge variant="secondary">Lucro: {formatCurrency(ultimaRecomendacao.lucro_estimado)}</Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Demanda</TableHead>
                  <TableHead>Lucro unitario</TableHead>
                  <TableHead>Desconto seguro</TableHead>
                  <TableHead>Lucro previsto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itensOrdenados.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{getProdutoNome(item)}</TableCell>
                    <TableCell>
                      {item.tipo_recomendacao === "COMPLEMENTO" ? "Complemento" : "Principal"}
                    </TableCell>
                    <TableCell>{item.quantidade_recomendada} un</TableCell>
                    <TableCell>{item.demanda_considerada} un</TableCell>
                    <TableCell>{formatCurrency(item.lucro_unitario)}</TableCell>
                    <TableCell>{getDescontoSeguroTexto(item)}</TableCell>
                    <TableCell>{formatCurrency(calcularLucroItem(item))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {recomendacoes.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="size-5" />
              Historico
            </CardTitle>
            <CardDescription>Planos gerados anteriormente</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Lucro estimado</TableHead>
                  <TableHead>Capacidade</TableHead>
                  <TableHead>Produtos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recomendacoes.slice(1).map((recomendacao) => (
                  <TableRow key={recomendacao.id}>
                    <TableCell>{formatDate(recomendacao.criado_em)}</TableCell>
                    <TableCell>{recomendacao.periodo_recomendado}</TableCell>
                    <TableCell>{formatCurrency(recomendacao.lucro_estimado)}</TableCell>
                    <TableCell>
                      {recomendacao.capacidade_usada}/{recomendacao.capacidade_total}
                    </TableCell>
                    <TableCell>{recomendacao.itens.length}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
