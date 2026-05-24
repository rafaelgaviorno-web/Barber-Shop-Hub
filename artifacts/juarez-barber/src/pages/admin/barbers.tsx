import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useListBarbershops, useListBarbers, useCreateBarber, useUpdateBarber, useDeleteBarber } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useQueryClient } from "@tanstack/react-query";

const barberSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  phone: z.string().optional(),
  specialties: z.string().optional(),
  commissionRate: z.coerce.number().min(0).max(100).optional(),
});
type BarberFormValues = z.infer<typeof barberSchema>;

export default function AdminBarbers() {
  const { data: shops } = useListBarbershops();
  const shopId = shops?.[0]?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: barbers, isLoading } = useListBarbers(shopId || 0, { query: { enabled: !!shopId, queryKey: ["barbers", shopId] as any } });
  const createBarber = useCreateBarber();
  const updateBarber = useUpdateBarber();
  const deleteBarber = useDeleteBarber();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const form = useForm<BarberFormValues>({ resolver: zodResolver(barberSchema), defaultValues: { name: "", phone: "", specialties: "", commissionRate: 0 } });

  const handleOpenEdit = (barber: any) => { setEditingId(barber.id); form.reset({ name: barber.name, phone: barber.phone || "", specialties: barber.specialties || "", commissionRate: barber.commissionRate || 0 }); setIsOpen(true); };
  const handleOpenAdd = () => { setEditingId(null); form.reset({ name: "", phone: "", specialties: "", commissionRate: 0 }); setIsOpen(true); };

  const onSubmit = async (data: BarberFormValues) => {
    if (!shopId) return;
    try {
      if (editingId) { await updateBarber.mutateAsync({ id: editingId, data }); toast({ title: "Barbeiro atualizado" }); }
      else { await createBarber.mutateAsync({ data: { ...data, barbershopId: shopId } }); toast({ title: "Barbeiro adicionado" }); }
      queryClient.invalidateQueries({ queryKey: ["barbers", shopId] as any });
      setIsOpen(false);
    } catch (error: any) { toast({ title: "Erro", description: error.message, variant: "destructive" }); }
  };

  const handleDelete = async () => {
    if (!deletingId || !shopId) return;
    try {
      await deleteBarber.mutateAsync({ id: deletingId });
      toast({ title: "Barbeiro removido" });
      queryClient.invalidateQueries({ queryKey: ["barbers", shopId] as any });
      setDeletingId(null);
    } catch (error: any) { toast({ title: "Erro", description: error.message, variant: "destructive" }); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Barbeiros</h2>
            <p className="text-muted-foreground">Gerencie sua equipe de profissionais.</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenAdd}><Plus className="h-4 w-4 mr-2" /> Adicionar Barbeiro</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingId ? "Editar Barbeiro" : "Adicionar Barbeiro"}</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Telefone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="specialties" render={({ field }) => (<FormItem><FormLabel>Especialidades</FormLabel><FormControl><Input {...field} placeholder="ex: Degradê, Barba" /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="commissionRate" render={({ field }) => (<FormItem><FormLabel>Comissão (%)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <Button type="submit" className="w-full" disabled={createBarber.isPending || updateBarber.isPending}>{createBarber.isPending || updateBarber.isPending ? "Salvando..." : "Salvar"}</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        {isLoading ? <div>Carregando...</div> : barbers?.length === 0 ? (
          <div className="flex justify-center items-center h-64 border rounded-xl bg-card text-muted-foreground">Nenhum barbeiro encontrado. Adicione um para começar.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {barbers?.map((barber) => (
              <Card key={barber.id} className="bg-card">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle>{barber.name}</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(barber)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeletingId(barber.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  {barber.phone && <div>Telefone: {barber.phone}</div>}
                  {barber.specialties && <div>Especialidades: {barber.specialties}</div>}
                  <div>Comissão: {barber.commissionRate}%</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>Esta ação não pode ser desfeita. O barbeiro será removido permanentemente.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{deleteBarber.isPending ? "Removendo..." : "Remover"}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
