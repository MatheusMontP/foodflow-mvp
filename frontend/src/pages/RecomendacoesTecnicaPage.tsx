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
  ClipboardCheck,
  CirclePlus,
  Loader2,
  PackageCheck,
  Target,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import {
  gerarRecomendacao,
  listarRecomendacoes,
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

export function RecomendacoesTecnicaPage() {
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

  const totalItensRecomendados = useMemo(
    () =>
      (ultimaRecomendacao?.itens ?? []).reduce(
        (total, item) => total + item.quantidade_recomendada,
        0
      ),
    [ultimaRecomendacao]
  );

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
      setMensagem("Recomendacao gerada com programacao linear.");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel gerar a recomendacao.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Recomendacoes</h2>
          <p className="text-muted-foreground">Otimizacao por programacao linear para producao de cozinha</p>
        </div>
        <Button onClick={() => void handleGerarRecomendacao()} disabled={gerando}>
          {gerando ? <Loader2 className="size-4 animate-spin" /> : <CirclePlus className="size-4" />}
          Gerar recomendacao
        </Button>
      </div>

      {mensagem && <p className="text-sm text-muted-foreground">{mensagem}</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lucro estimado</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(ultimaRecomendacao?.lucro_estimado ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">resultado da ultima otimizacao</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Capacidade usada</CardTitle>
            <Target className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ultimaRecomendacao?.capacidade_usada ?? 0}/{ultimaRecomendacao?.capacidade_total ?? Number(capacidadeDiaria)}
            </div>
            <p className="text-xs text-muted-foreground">itens dentro da restricao diaria</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Itens recomendados</CardTitle>
            <PackageCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItensRecomendados}</div>
            <p className="text-xs text-muted-foreground">quantidade total sugerida</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="size-5" />
            Parametros da otimizacao
          </CardTitle>
          <CardDescription>O solver maximiza margem respeitando demanda, capacidade e estoque de insumos</CardDescription>
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
              Otimizar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ultima recomendacao</CardTitle>
          <CardDescription>
            {ultimaRecomendacao
              ? `Gerada em ${formatDate(ultimaRecomendacao.criado_em)}`
              : "Nenhuma recomendacao gerada ainda"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 size-5 animate-spin" />
              Carregando recomendacoes...
            </div>
          ) : ultimaRecomendacao ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Confianca {ultimaRecomendacao.fator_confianca}/10</Badge>
                <Badge variant="secondary">Periodo: {ultimaRecomendacao.periodo_recomendado}</Badge>
                <Badge variant="secondary">
                  Insumos limitantes: {formatLimitantes(ultimaRecomendacao.insumos_limitantes)}
                </Badge>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Quantidade sugerida</TableHead>
                    <TableHead>Demanda considerada</TableHead>
                    <TableHead>Lucro unitario</TableHead>
                    <TableHead>Lucro estimado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ultimaRecomendacao.itens.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.produto_nome ?? `Produto ${item.produto_id}`}</TableCell>
                      <TableCell>{item.quantidade_recomendada} un</TableCell>
                      <TableCell>{item.demanda_considerada} un</TableCell>
                      <TableCell>{formatCurrency(item.lucro_unitario)}</TableCell>
                      <TableCell>
                        {formatCurrency(Number(item.lucro_unitario) * item.quantidade_recomendada)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
              <AlertTriangle className="size-8 opacity-40" />
              <p className="text-sm">Gere uma recomendacao para visualizar o resultado.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {recomendacoes.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Historico</CardTitle>
            <CardDescription>Execucoes anteriores do modelo de otimizacao</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Lucro estimado</TableHead>
                  <TableHead>Capacidade</TableHead>
                  <TableHead>Itens</TableHead>
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
