import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useListBarbershops, useListServices, useCreateService, useUpdateService, useDeleteService } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useQueryClient } from "@tanstack/react-query";

const serviceSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Preço deve ser positivo"),
  durationMinutes: z.coerce.number().min(1, "Duração deve ser positiva"),
});
type ServiceFormValues = z.infer<typeof serviceSchema>;

export default function AdminServices() {
  const { data: shops } = useListBarbershops();
  const shopId = shops?.[0]?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: services, isLoading } = useListServices(shopId || 0, { query: { enabled: !!shopId, queryKey: ["services", shopId] as any } });
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const form = useForm<ServiceFormValues>({ resolver: zodResolver(serviceSchema), defaultValues: { name: "", description: "", price: 0, durationMinutes: 30 } });

  const handleOpenEdit = (service: any) => { setEditingId(service.id); form.reset({ name: service.name, description: service.description || "", price: service.price, durationMinutes: service.durationMinutes }); setIsOpen(true); };
  const handleOpenAdd = () => { setEditingId(null); form.reset({ name: "", description: "", price: 0, durationMinutes: 30 }); setIsOpen(true); };

  const onSubmit = async (data: ServiceFormValues) => {
    if (!shopId) return;
    try {
      if (editingId) { await updateService.mutateAsync({ id: editingId, data }); toast({ title: "Serviço atualizado" }); }
      else { await createService.mutateAsync({ data: { ...data, barbershopId: shopId } }); toast({ title: "Serviço adicionado" }); }
      queryClient.invalidateQueries({ queryKey: ["services", shopId] as any });
      setIsOpen(false);
    } catch (error: any) { toast({ title: "Erro", description: error.message, variant: "destructive" }); }
  };

  const handleDelete = async () => {
    if (!deletingId || !shopId) return;
    try {
      await deleteService.mutateAsync({ id: deletingId });
      toast({ title: "Serviço removido" });
      queryClient.invalidateQueries({ queryKey: ["services", shopId] as any });
      setDeletingId(null);
    } catch (error: any) { toast({ title: "Erro", description: error.message, variant: "destructive" }); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Serviços</h2>
            <p className="text-muted-foreground">Gerencie seus cortes e serviços de barbearia.</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenAdd}><Plus className="h-4 w-4 mr-2" /> Adicionar Serviço</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingId ? "Editar Serviço" : "Adicionar Serviço"}</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} placeholder="ex: Corte Premium" /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrição</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Preço (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="durationMinutes" render={({ field }) => (<FormItem><FormLabel>Duração (min)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={createService.isPending || updateService.isPending}>{createService.isPending || updateService.isPending ? "Salvando..." : "Salvar"}</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        {isLoading ? <div>Carregando...</div> : services?.length === 0 ? (
          <div className="flex justify-center items-center h-64 border rounded-xl bg-card text-muted-foreground">Nenhum serviço encontrado. Adicione um para começar.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services?.map((service) => (
              <Card key={service.id} className="bg-card">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div><CardTitle>{service.name}</CardTitle><div className="text-2xl font-bold mt-1">R$ {service.price}</div></div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(service)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeletingId(service.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  {service.description && <div>{service.description}</div>}
                  <div className="flex items-center gap-1"><Clock className="h-3 w-3"/> {service.durationMinutes} min</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>Esta ação não pode ser desfeita. O serviço será removido permanentemente.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{deleteService.isPending ? "Removendo..." : "Remover"}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
