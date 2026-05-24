import { useListAppointments } from "@workspace/api-client-react";
import { format } from "date-fns";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Calendar as CalendarIcon, Clock, MapPin, User, Scissors } from "lucide-react";

export default function MyAppointments() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!user) setLocation("/login");
  }, [user, setLocation]);

  const { data: appointments, isLoading } = useListAppointments({});

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Pending</Badge>;
      case "confirmed": return <Badge className="bg-green-600 hover:bg-green-700 text-white">Confirmed</Badge>;
      case "completed": return <Badge variant="secondary">Completed</Badge>;
      case "cancelled": return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <ClientLayout>
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Appointments</h1>
          <p className="text-muted-foreground">Manage your upcoming and past bookings.</p>
        </div>

        {isLoading ? (
          <div>Loading appointments...</div>
        ) : appointments?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border border-dashed rounded-xl bg-card text-muted-foreground">
            <p>You have no appointments.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments?.map(apt => (
              <Card key={apt.id} className="bg-card">
                <CardHeader className="pb-3 border-b border-border/50">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-primary" />
                      {format(new Date(apt.scheduledAt), "EEEE, MMMM do, yyyy")}
                    </CardTitle>
                    {getStatusBadge(apt.status)}
                  </div>
                </CardHeader>
                <CardContent className="pt-4 flex flex-col md:flex-row gap-6 md:gap-12">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium text-foreground">{format(new Date(apt.scheduledAt), "h:mm a")}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Scissors className="h-4 w-4" />
                      <span className="text-foreground">{apt.serviceName}</span>
                      {apt.servicePrice && <span className="ml-auto font-medium">${apt.servicePrice}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Barber: <span className="text-foreground font-medium">{apt.barberName}</span></span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
