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
  Clock,
  Package,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
} from "recharts";

// Dados de exemplo
const vendasSemana = [
  { dia: "Seg", valor: 1200 },
  { dia: "Ter", valor: 1800 },
  { dia: "Qua", valor: 1400 },
  { dia: "Qui", valor: 2200 },
  { dia: "Sex", valor: 2800 },
  { dia: "Sab", valor: 3200 },
  { dia: "Dom", valor: 2400 },
];

const vendasHora = [
  { hora: "10h", valor: 150 },
  { hora: "11h", valor: 280 },
  { hora: "12h", valor: 520 },
  { hora: "13h", valor: 480 },
  { hora: "14h", valor: 320 },
  { hora: "15h", valor: 180 },
  { hora: "16h", valor: 220 },
  { hora: "17h", valor: 340 },
  { hora: "18h", valor: 560 },
  { hora: "19h", valor: 620 },
  { hora: "20h", valor: 480 },
  { hora: "21h", valor: 320 },
];

const produtosMaisVendidos = [
  { nome: "X-Bacon", quantidade: 145, valor: 2175 },
  { nome: "X-Tudo", quantidade: 98, valor: 1862 },
  { nome: "X-Salada", quantidade: 87, valor: 1131 },
  { nome: "Batata Frita G", quantidade: 156, valor: 1248 },
  { nome: "Refrigerante", quantidade: 234, valor: 1170 },
];

const alertasEstoque = [
  { nome: "Hambúrguer 180g", estoque: 12, minimo: 50 },
  { nome: "Pão de Hambúrguer", estoque: 24, minimo: 100 },
  { nome: "Bacon", estoque: 2, minimo: 10 },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Métricas principais */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(3842)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+12.5%</span> em relação a ontem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <ShoppingBag className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+8</span> pedidos pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(30.25)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+4.2%</span> esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alertas</CardTitle>
            <AlertTriangle className="size-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Produtos com estoque baixo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vendas da Semana</CardTitle>
            <CardDescription>Total de vendas por dia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendasSemana}>
                  <XAxis
                    dataKey="dia"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R$${value}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
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
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vendas por Hora</CardTitle>
            <CardDescription>Movimento ao longo do dia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vendasHora}>
                  <XAxis
                    dataKey="hora"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R$${value}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <p className="text-sm font-medium">
                              {formatCurrency(payload[0].value as number)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="valor"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabelas */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="size-5" />
              Mais Vendidos
            </CardTitle>
            <CardDescription>Produtos com maior saída hoje</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {produtosMaisVendidos.map((produto, index) => (
                <div
                  key={produto.nome}
                  className="flex items-center justify-between"
                >
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
                  <span className="font-medium">
                    {formatCurrency(produto.valor)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-yellow-500" />
              Estoque Baixo
            </CardTitle>
            <CardDescription>
              Produtos que precisam de reposição
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {alertasEstoque.map((item) => (
                <div
                  key={item.nome}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{item.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      Mínimo: {item.minimo} unidades
                    </p>
                  </div>
                  <Badge variant={item.estoque < 10 ? "destructive" : "warning"}>
                    {item.estoque} un
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pedidos pendentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-5" />
            Pedidos Pendentes
          </CardTitle>
          <CardDescription>Pedidos aguardando preparo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((pedido) => (
              <div
                key={pedido}
                className="flex flex-col gap-2 rounded-lg border p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">#{String(pedido).padStart(3, "0")}</span>
                  <Badge variant="warning">Pendente</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  2x X-Bacon, 1x Batata G
                </p>
                <p className="text-xs text-muted-foreground">Há 5 min</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
