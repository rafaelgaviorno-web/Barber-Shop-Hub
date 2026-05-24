import { useListAppointments, useUpdateAppointmentStatus, useListBarbershops } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Clock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminAppointments() {
  const { data: shops } = useListBarbershops();
  const shopId = shops?.[0]?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: appointments, isLoading } = useListAppointments(
    { barbershopId: shopId },
    { query: { enabled: !!shopId, queryKey: ['appointments', shopId] as any } }
  );

  const updateStatus = useUpdateAppointmentStatus();

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, data: { status } });
      toast({ title: `Appointment marked as ${status}.` });
      queryClient.invalidateQueries({ queryKey: ['appointments', shopId] as any });
    } catch (error: any) {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Appointments</h2>
          <p className="text-muted-foreground">Manage incoming bookings.</p>
        </div>

        {isLoading ? (
          <div>Loading...</div>
        ) : appointments?.length === 0 ? (
          <div className="flex justify-center items-center h-64 border rounded-xl bg-card text-muted-foreground">
            No appointments found.
          </div>
        ) : (
          <div className="space-y-4">
            {appointments?.map(apt => (
              <Card key={apt.id} className="bg-card">
                <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="space-y-1 w-full md:w-auto">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{apt.clientName || 'Unknown Client'}</span>
                      <Badge variant={apt.status === 'pending' ? 'outline' : apt.status === 'confirmed' ? 'default' : 'secondary'} 
                             className={apt.status === 'pending' ? 'text-yellow-500' : ''}>
                        {apt.status}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground text-sm flex gap-4">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(apt.scheduledAt), "MMM d, yyyy h:mm a")}</span>
                      <span>Barber: {apt.barberName}</span>
                      <span>Service: {apt.serviceName} (${apt.servicePrice})</span>
                    </div>
                    {apt.notes && <p className="text-sm italic">Note: {apt.notes}</p>}
                  </div>
                  
                  <div className="flex gap-2 w-full md:w-auto justify-end">
                    {apt.status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => handleUpdateStatus(apt.id, 'confirmed')} className="bg-green-600 hover:bg-green-700">
                          <Check className="h-4 w-4 mr-1" /> Confirm
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(apt.id, 'cancelled')}>
                          <X className="h-4 w-4 mr-1" /> Cancel
                        </Button>
                      </>
                    )}
                    {apt.status === 'confirmed' && (
                      <Button size="sm" onClick={() => handleUpdateStatus(apt.id, 'completed')} variant="secondary">
                        Mark Completed
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
