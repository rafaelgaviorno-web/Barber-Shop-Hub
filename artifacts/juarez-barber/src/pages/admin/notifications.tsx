import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useDeleteNotification } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, CheckCheck, Trash2, Calendar, Package, Info } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
  appointment: Calendar,
  stock: Package,
  info: Info,
};

export default function AdminNotifications() {
  const { data: notifications, isLoading } = useListNotifications({ query: { refetchInterval: 30000 } });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const deleteNotif = useDeleteNotification();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const unreadCount = notifications?.filter(n => !n.read).length ?? 0;

  const invalidate = () => queryClient.invalidateQueries({ predicate: (q) => q.queryKey.includes("listNotifications") });

  const handleMarkRead = async (id: number) => {
    await markRead.mutateAsync({ id });
    invalidate();
  };

  const handleMarkAll = async () => {
    await markAll.mutateAsync();
    toast({ title: "Todas as notificações marcadas como lidas" });
    invalidate();
  };

  const handleDelete = async (id: number) => {
    await deleteNotif.mutateAsync({ id });
    invalidate();
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              Notificações
              {unreadCount > 0 && <Badge className="text-sm">{unreadCount} novas</Badge>}
            </h2>
            <p className="text-muted-foreground">Alertas e atualizações da sua barbearia.</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAll}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        {isLoading ? (
          <div>Carregando...</div>
        ) : notifications?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-xl bg-card text-muted-foreground gap-3">
            <Bell className="h-12 w-12 opacity-30" />
            <p>Nenhuma notificação por enquanto.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications?.map(notif => {
              const Icon = NOTIFICATION_ICONS[notif.type] || Info;
              return (
                <Card key={notif.id} className={`bg-card transition-colors ${!notif.read ? "border-primary/30 bg-primary/5" : ""}`}>
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className={`p-2 rounded-full shrink-0 ${!notif.read ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`font-medium ${!notif.read ? "text-foreground" : "text-muted-foreground"}`}>{notif.title}</p>
                        {!notif.read && <Badge variant="default" className="text-xs">Nova</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {!notif.read && (
                        <Button variant="ghost" size="icon" onClick={() => handleMarkRead(notif.id)} title="Marcar como lida">
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(notif.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
