import { useGetDashboard, useListBarbershops } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, Users, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const { data: shops } = useListBarbershops();
  const shopId = shops?.[0]?.id;

  const { data: stats, isLoading } = useGetDashboard(
    { barbershopId: shopId },
    { query: { enabled: !!shopId, queryKey: ["dashboard", shopId] as any } }
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Painel</h2>
          <p className="text-muted-foreground">Visão geral do desempenho da sua barbearia hoje.</p>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <Card key={i}><CardHeader><Skeleton className="h-4 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-16" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Hoje</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ {stats?.revenueToday || 0}</div>
                  <p className="text-xs text-muted-foreground pt-1">R$ {stats?.revenueThisWeek || 0} esta semana</p>
                </CardContent>
              </Card>
              <Card className="bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.appointmentsToday || 0}</div>
                  <p className="text-xs text-muted-foreground pt-1">{stats?.appointmentsThisWeek || 0} esta semana</p>
                </CardContent>
              </Card>
              <Card className="bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Aguardando Confirmação</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.pendingAppointments || 0}</div>
                  <p className="text-xs text-muted-foreground pt-1">Necessita confirmação</p>
                </CardContent>
              </Card>
              <Card className="bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Barbeiros Ativos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.topBarbers?.length || 0}</div>
                </CardContent>
              </Card>
            </div>
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Melhores Barbeiros da Semana</h3>
              <div className="bg-card rounded-lg border border-border">
                {stats?.topBarbers?.length ? (
                  <div className="divide-y divide-border">
                    {stats.topBarbers.map((barber: any) => (
                      <div key={barber.barberId} className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{barber.name.charAt(0)}</div>
                          <div>
                            <p className="font-medium">{barber.name}</p>
                            <p className="text-sm text-muted-foreground">{barber.appointmentsCount} atendimentos</p>
                          </div>
                        </div>
                        <div className="font-bold">R$ {barber.revenue}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">Nenhum dado disponível.</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
