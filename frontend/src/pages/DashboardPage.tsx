import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Package,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { buscarDashboard, listarVendas, type Dashboard, type Venda } from "@/servicos/api";
import { formatarQuantidade } from "@/lib/utils";

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

function formatCurrencyCompact(value: number | string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function parseApiDate(value: string) {
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value);
  return new Date(hasTimezone ? value : `${value}Z`);
}

function localDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function localHour(date: Date) {
  return Number(
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(date)
  );
}

export function DashboardPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarDashboard() {
    setLoading(true);
    try {
      const [dashboardDados, vendasDados] = await Promise.all([
        buscarDashboard(),
        listarVendas(),
      ]);
      setDashboard(dashboardDados);
      setVendas(vendasDados);
      setErro("");
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Nao foi possivel carregar o dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void carregarDashboard();
    window.addEventListener("foodflow:data-updated", carregarDashboard);
    return () => window.removeEventListener("foodflow:data-updated", carregarDashboard);
  }, []);

  const vendasPorHora = useMemo(() => {
    const agora = new Date();
    const hoje = localDateKey(agora);
    const grupos = Array.from({ length: 24 }, (_, hora) => ({
      hora: `${String(hora).padStart(2, "0")}h`,
      valor: 0,
    }));

    vendas
      .filter((venda) => venda.status === "CONCLUIDA")
      .forEach((venda) => {
        const criadoEm = parseApiDate(venda.criado_em);
        if (localDateKey(criadoEm) !== hoje) return;

        grupos[localHour(criadoEm)].valor += Number(venda.total);
      });

    return grupos.some((grupo) => grupo.valor > 0) ? grupos : [];
  }, [vendas]);

  const horariosReferencia = useMemo(
    () => vendasPorHora.filter((_, index) => index % 4 === 0).map((grupo) => grupo.hora),
    [vendasPorHora]
  );

  if (loading && !dashboard) {
    return (
      <div className="flex h-80 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Atualizando indicadores...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboard?.faturamento ?? 0)}</div>
            <p className="text-xs text-muted-foreground">Faturamento confirmado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <ShoppingBag className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.vendas_concluidas ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {dashboard?.vendas_canceladas ?? 0} canceladas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ticket Medio</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboard?.ticket_medio ?? 0)}</div>
            <p className="text-xs text-muted-foreground">
              {dashboard?.itens_vendidos ?? 0} itens vendidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alertas</CardTitle>
            <AlertTriangle className="size-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.alertas_estoque.length ?? 0}</div>
            <p className="text-xs text-muted-foreground">Insumos abaixo do minimo</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Hora</CardTitle>
            <CardDescription>Faturamento por horario do dia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {vendasPorHora.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vendasPorHora} barCategoryGap="40%">
                    <XAxis
                      dataKey="hora"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      ticks={horariosReferencia}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatCurrencyCompact}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <p className="text-xs text-muted-foreground">
                                Horario: {payload[0].payload.hora}
                              </p>
                              <p className="text-sm font-medium">
                                {formatCurrency(payload[0].value as number)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="valor"
                      fill="var(--color-primary)"
                      maxBarSize={16}
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Nenhuma venda concluida hoje.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="size-5" />
              Mais Vendidos
            </CardTitle>
            <CardDescription>Ranking real das vendas concluidas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {(dashboard?.produtos_mais_vendidos ?? []).length > 0 ? (
                dashboard?.produtos_mais_vendidos.map((produto, index) => (
                  <div key={produto.produto_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{produto.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {produto.quantidade} unidades
                        </p>
                      </div>
                    </div>
                    <span className="font-medium">{formatCurrency(produto.total)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Sem vendas registradas.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-yellow-500" />
            Estoque Baixo
          </CardTitle>
          <CardDescription>Insumos atualizados apos vendas e ajustes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {(dashboard?.alertas_estoque ?? []).length > 0 ? (
              dashboard?.alertas_estoque.map((item) => (
                <div key={item.insumo_id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      Minimo: {formatarQuantidade(item.estoque_minimo)}
                    </p>
                  </div>
                  <Badge variant={Number(item.quantidade_estoque) <= 0 ? "destructive" : "warning"}>
                    {formatarQuantidade(item.quantidade_estoque)}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum alerta de estoque.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
