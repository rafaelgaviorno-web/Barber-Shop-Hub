import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGetBarbershop, useUpdateBarbershop, useListBarbershops, useCreateBarbershop } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

const shopSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  address: z.string().optional(),
  phone: z.string().optional(),
  description: z.string().optional(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
});
type ShopFormValues = z.infer<typeof shopSchema>;

export default function AdminBarbershop() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: shops, isLoading: shopsLoading } = useListBarbershops();
  const shop = shops?.find(s => s.ownerId === user?.id) || shops?.[0];
  const form = useForm<ShopFormValues>({ resolver: zodResolver(shopSchema), defaultValues: { name: "", address: "", phone: "", description: "", openTime: "09:00", closeTime: "18:00" } });

  useEffect(() => {
    if (shop) {
      form.reset({ name: shop.name, address: shop.address || "", phone: shop.phone || "", description: shop.description || "", openTime: shop.openTime || "09:00", closeTime: shop.closeTime || "18:00" });
    }
  }, [shop, form]);

  const updateMutation = useUpdateBarbershop();
  const createMutation = useCreateBarbershop();

  const onSubmit = async (data: ShopFormValues) => {
    try {
      if (shop?.id) { await updateMutation.mutateAsync({ id: shop.id, data }); toast({ title: "Barbearia atualizada com sucesso." }); }
      else { await createMutation.mutateAsync({ data }); toast({ title: "Barbearia criada com sucesso." }); }
    } catch (error: any) { toast({ variant: "destructive", title: "Erro ao salvar barbearia", description: error.message }); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Minha Barbearia</h2>
          <p className="text-muted-foreground">Gerencie as informações públicas da sua barbearia.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Perfil da Barbearia</CardTitle>
            <CardDescription>Estas informações são visíveis aos clientes ao realizar agendamentos.</CardDescription>
          </CardHeader>
          <CardContent>
            {shopsLoading ? <div>Carregando...</div> : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome da Barbearia</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Telefone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Endereço</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="openTime" render={({ field }) => (<FormItem><FormLabel>Horário de Abertura</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="closeTime" render={({ field }) => (<FormItem><FormLabel>Horário de Fechamento</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="pt-4">
                    <Button type="submit" disabled={updateMutation.isPending || createMutation.isPending}>
                      {updateMutation.isPending || createMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
