import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, ShoppingBag, Package } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const vendasMes = [
  { semana: "Sem 1", valor: 12500 },
  { semana: "Sem 2", valor: 15800 },
  { semana: "Sem 3", valor: 14200 },
  { semana: "Sem 4", valor: 18900 },
];

const vendasCategoria = [
  { nome: "Lanches", valor: 45000, cor: "#10b981" },
  { nome: "Porções", valor: 18000, cor: "#3b82f6" },
  { nome: "Bebidas", valor: 12000, cor: "#f59e0b" },
  { nome: "Sobremesas", valor: 8000, cor: "#8b5cf6" },
];

const topProdutos = [
  { nome: "X-Bacon", quantidade: 456, valor: 10430.40 },
  { nome: "X-Tudo", quantidade: 389, valor: 10464.10 },
  { nome: "Batata Frita G", quantidade: 534, valor: 12228.60 },
  { nome: "Coca-Cola Lata", quantidade: 789, valor: 5444.10 },
  { nome: "X-Salada", quantidade: 234, valor: 4422.60 },
];

const formasPagamento = [
  { forma: "Cartão de Crédito", quantidade: 456, valor: 28500 },
  { forma: "PIX", quantidade: 389, valor: 24300 },
  { forma: "Cartão de Débito", quantidade: 234, valor: 15600 },
  { forma: "Dinheiro", quantidade: 178, valor: 11200 },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function RelatoriosPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Cards de resumo */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Mensal</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(61400)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+18.2%</span> vs. mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <ShoppingBag className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.257</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+12.5%</span> vs. mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(48.85)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+5.1%</span> vs. mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Produtos Vendidos</CardTitle>
            <Package className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.892</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+8.3%</span> vs. mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="vendas">
        <TabsList>
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="vendas" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Vendas por Semana</CardTitle>
                <CardDescription>Faturamento semanal do mês</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vendasMes}>
                      <XAxis dataKey="semana" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value / 1000}k`} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <p className="text-sm font-medium">{formatCurrency(payload[0].value as number)}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="valor" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vendas por Categoria</CardTitle>
                <CardDescription>Distribuição de vendas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={vendasCategoria}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="valor"
                      >
                        {vendasCategoria.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.cor} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <p className="text-sm font-medium">{payload[0].name}</p>
                                <p className="text-sm">{formatCurrency(payload[0].value as number)}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                  {vendasCategoria.map((cat) => (
                    <div key={cat.nome} className="flex items-center gap-2">
                      <div className="size-3 rounded-full" style={{ backgroundColor: cat.cor }} />
                      <span className="text-sm">{cat.nome}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="produtos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Produtos Mais Vendidos</CardTitle>
              <CardDescription>Ranking de vendas do mês</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ranking</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Faturamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProdutos.map((produto, index) => (
                    <TableRow key={produto.nome}>
                      <TableCell>
                        <Badge variant={index < 3 ? "default" : "secondary"}>
                          #{index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{produto.nome}</TableCell>
                      <TableCell>{produto.quantidade} un</TableCell>
                      <TableCell>{formatCurrency(produto.valor)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagamentos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Formas de Pagamento</CardTitle>
              <CardDescription>Distribuição por método de pagamento</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Forma de Pagamento</TableHead>
                    <TableHead>Transações</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>% do Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formasPagamento.map((pagamento) => {
                    const totalGeral = formasPagamento.reduce((acc, p) => acc + p.valor, 0);
                    const percentual = ((pagamento.valor / totalGeral) * 100).toFixed(1);
                    return (
                      <TableRow key={pagamento.forma}>
                        <TableCell className="font-medium">{pagamento.forma}</TableCell>
                        <TableCell>{pagamento.quantidade}</TableCell>
                        <TableCell>{formatCurrency(pagamento.valor)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{percentual}%</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
