import { useListBarbershops, useGetFinancialSummary, useGetMonthlyCashflow, useGetAppointmentsByStatus, useListCommissions } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, PieChart as PieChartIcon, Percent } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PIE_COLORS = ["#22c55e", "#eab308", "#64748b", "#ef4444"];

const MONTH_LABELS: Record<string, string> = {
  Jan: "Jan", Feb: "Fev", Mar: "Mar", Apr: "Abr", May: "Mai", Jun: "Jun",
  Jul: "Jul", Aug: "Ago", Sep: "Set", Oct: "Out", Nov: "Nov", Dec: "Dez"
};

export default function AdminFinancial() {
  const { data: shops } = useListBarbershops();
  const shopId = shops?.[0]?.id;

  const { data: summary } = useGetFinancialSummary({ barbershopId: shopId }, { query: { enabled: !!shopId, queryKey: ["financialSummary", { barbershopId: shopId }] as any } });
  const { data: cashflow } = useGetMonthlyCashflow({ barbershopId: shopId, year: new Date().getFullYear() }, { query: { enabled: !!shopId, queryKey: ["monthlyCashflow", { barbershopId: shopId }] as any } });
  const { data: aptStatus } = useGetAppointmentsByStatus({ barbershopId: shopId }, { query: { enabled: !!shopId, queryKey: ["appointmentsStatus", { barbershopId: shopId }] as any } });
  const { data: commissions, isLoading: commsLoading } = useListCommissions({ barbershopId: shopId }, { query: { enabled: !!shopId, queryKey: ["commissions", { barbershopId: shopId }] as any } });

  const pieData = aptStatus ? [
    { name: "Concluídos", value: aptStatus.completed },
    { name: "Pendentes", value: aptStatus.pending },
    { name: "Confirmados", value: aptStatus.confirmed },
    { name: "Cancelados", value: aptStatus.cancelled },
  ].filter(d => d.value > 0) : [];

  const cashflowTranslated = cashflow?.map(c => ({ ...c, month: MONTH_LABELS[c.month] || c.month }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financeiro</h2>
          <p className="text-muted-foreground">Acompanhe receitas, despesas e desempenho.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-500">R$ {summary?.totalRevenue || 0}</div></CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-red-500">R$ {summary?.totalExpenses || 0}</div></CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-primary">R$ {summary?.netProfit || 0}</div></CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comissões Pagas</CardTitle>
              <PieChartIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">R$ {summary?.totalCommissions || 0}</div></CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card">
            <CardHeader><CardTitle>Fluxo de Caixa ({new Date().getFullYear()})</CardTitle></CardHeader>
            <CardContent>
              <div className="h-80">
                {cashflowTranslated && cashflowTranslated.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cashflowTranslated}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="month" stroke="#888" />
                      <YAxis stroke="#888" />
                      <Tooltip contentStyle={{ backgroundColor: "#111", borderColor: "#333" }} />
                      <Legend formatter={(v) => v === "revenue" ? "Receita" : v === "expenses" ? "Despesas" : "Lucro"} />
                      <Bar dataKey="revenue" fill="#22c55e" name="Receita" />
                      <Bar dataKey="expenses" fill="#ef4444" name="Despesas" />
                      <Bar dataKey="profit" fill="#eab308" name="Lucro" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-muted-foreground">Sem dados disponíveis</div>}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader><CardTitle>Status dos Agendamentos</CardTitle></CardHeader>
            <CardContent>
              <div className="h-80">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                        {pieData.map((_, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#111", borderColor: "#333" }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-muted-foreground">Sem dados disponíveis</div>}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="pt-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><Percent className="h-5 w-5 text-primary" /> Comissões Pagas</h3>
          <Card className="bg-card">
            <CardContent className="p-0">
              {commsLoading ? (
                <div className="p-8 text-center text-muted-foreground">Carregando...</div>
              ) : commissions?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">Nenhuma comissão registrada.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Barbeiro</TableHead>
                      <TableHead>Referência</TableHead>
                      <TableHead className="text-right">Taxa</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions?.map((comm) => (
                      <TableRow key={comm.id}>
                        <TableCell>{format(new Date(comm.createdAt), "d MMM yyyy", { locale: ptBR })}</TableCell>
                        <TableCell>{comm.barberName}</TableCell>
                        <TableCell>Venda #{comm.saleId}</TableCell>
                        <TableCell className="text-right">{comm.rate}%</TableCell>
                        <TableCell className="text-right font-medium text-primary">R$ {comm.amount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
