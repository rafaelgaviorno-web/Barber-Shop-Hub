import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  useGetBarbershop,
  useListBarbers,
  useListServices,
  useGetAvailability,
  useCreateAppointment,
  getGetAvailabilityQueryKey
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";

const bookingSchema = z.object({
  barberId: z.coerce.number().min(1, "Selecione um barbeiro"),
  serviceId: z.coerce.number().min(1, "Selecione um serviço"),
  date: z.date({ required_error: "Selecione uma data" }),
  timeSlot: z.string().min(1, "Selecione um horário"),
  notes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export default function BookAppointment() {
  const params = useParams();
  const barbershopId = parseInt(params.barbershopId || "0");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: shop } = useGetBarbershop(barbershopId);
  const { data: barbers } = useListBarbers(barbershopId);
  const { data: services } = useListServices(barbershopId);

  const form = useForm<BookingFormValues>({ resolver: zodResolver(bookingSchema) });

  const selectedBarberId = form.watch("barberId");
  const selectedServiceId = form.watch("serviceId");
  const selectedDate = form.watch("date");
  const formattedDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";

  const { data: availability, isLoading: loadingAvailability } = useGetAvailability(
    { barberId: selectedBarberId, serviceId: selectedServiceId, date: formattedDate },
    { query: { enabled: !!(selectedBarberId && selectedServiceId && formattedDate), queryKey: getGetAvailabilityQueryKey({ barberId: selectedBarberId, serviceId: selectedServiceId, date: formattedDate }) } }
  );

  const createAppointment = useCreateAppointment();

  const onSubmit = async (data: BookingFormValues) => {
    if (!user) {
      toast({ title: "Faça login para agendar", variant: "destructive" });
      setLocation("/login");
      return;
    }
    const scheduledAt = `${format(data.date, "yyyy-MM-dd")}T${data.timeSlot}:00Z`;
    try {
      await createAppointment.mutateAsync({
        data: { barbershopId, barberId: data.barberId, serviceId: data.serviceId, scheduledAt, notes: data.notes }
      });
      toast({ title: "Agendamento realizado com sucesso!" });
      setLocation("/my-appointments");
    } catch (error: any) {
      toast({ title: "Erro ao agendar", description: error.message, variant: "destructive" });
    }
  };

  return (
    <ClientLayout>
      <div className="max-w-2xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-8">
          Agendar Horário {shop ? `em ${shop.name}` : ""}
        </h1>
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="serviceId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serviço</FormLabel>
                      <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Escolha um serviço" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {services?.map(s => (
                            <SelectItem key={s.id} value={s.id.toString()}>{s.name} — R$ {s.price} ({s.durationMinutes}min)</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="barberId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barbeiro</FormLabel>
                      <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Escolha um barbeiro" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {barbers?.map(b => (
                            <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {selectedBarberId && selectedServiceId && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                    <FormField control={form.control} name="date" render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data</FormLabel>
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          className="rounded-md border self-start"
                        />
                        <FormMessage />
                      </FormItem>
                    )} />
                    {selectedDate && (
                      <FormField control={form.control} name="timeSlot" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horários disponíveis</FormLabel>
                          <div className="grid grid-cols-3 gap-2">
                            {loadingAvailability ? (
                              <div className="col-span-3 text-sm text-muted-foreground">Carregando horários...</div>
                            ) : availability?.slots?.length ? (
                              availability.slots.map(slot => (
                                <Button
                                  key={slot}
                                  type="button"
                                  variant={field.value === slot ? "default" : "outline"}
                                  onClick={() => field.onChange(slot)}
                                  className="w-full"
                                >
                                  {slot}
                                </Button>
                              ))
                            ) : (
                              <div className="col-span-3 text-sm text-muted-foreground">Nenhum horário disponível nesta data.</div>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}
                  </div>
                )}

                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações (opcional)</FormLabel>
                    <FormControl><Input placeholder="Alguma solicitação especial..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" className="w-full" size="lg" disabled={createAppointment.isPending}>
                  {createAppointment.isPending ? "Agendando..." : "Confirmar Agendamento"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
}
