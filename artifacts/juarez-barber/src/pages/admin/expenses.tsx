import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useListBarbershops, useListExpenses, useCreateExpense, useDeleteExpense } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const expenseSchema = z.object({
  amount: z.coerce.number().min(0.01, "Valor deve ser positivo"),
  description: z.string().min(2, "Descrição é obrigatória"),
  category: z.string().min(1, "Categoria é obrigatória"),
});
type ExpenseFormValues = z.infer<typeof expenseSchema>;

const EXPENSE_CATEGORIES = ["Aluguel", "Utilidades", "Suprimentos", "Marketing", "Manutenção", "Outros"];

export default function AdminExpenses() {
  const { data: shops } = useListBarbershops();
  const shopId = shops?.[0]?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: expenses, isLoading } = useListExpenses({ barbershopId: shopId }, { query: { enabled: !!shopId, queryKey: ["expenses", { barbershopId: shopId }] as any } });
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<ExpenseFormValues>({ resolver: zodResolver(expenseSchema), defaultValues: { amount: 0, description: "", category: "" } });

  const onSubmit = async (data: ExpenseFormValues) => {
    if (!shopId) return;
    try {
      await createExpense.mutateAsync({ data: { ...data, barbershopId: shopId } });
      toast({ title: "Despesa registrada" });
      queryClient.invalidateQueries({ queryKey: ["expenses", { barbershopId: shopId }] as any });
      setIsOpen(false);
    } catch (error: any) { toast({ title: "Erro", description: error.message, variant: "destructive" }); }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteExpense.mutateAsync({ id });
      toast({ title: "Despesa removida" });
      queryClient.invalidateQueries({ queryKey: ["expenses", { barbershopId: shopId }] as any });
    } catch (error: any) { toast({ title: "Erro", description: error.message, variant: "destructive" }); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Despesas</h2>
            <p className="text-muted-foreground">Controle os gastos da sua barbearia.</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { form.reset({ amount: 0, description: "", category: "" }); setIsOpen(true); }}><Plus className="h-4 w-4 mr-2" /> Registrar Despesa</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Despesa</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrição</FormLabel><FormControl><Input {...field} placeholder="ex: Conta de Luz" /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Valor (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger></FormControl>
                        <SelectContent>{EXPENSE_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={createExpense.isPending}>{createExpense.isPending ? "Salvando..." : "Salvar Despesa"}</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        <Card className="bg-card">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Carregando...</div>
            ) : expenses?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Nenhuma despesa registrada.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses?.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{format(new Date(expense.createdAt), "d MMM yyyy, HH:mm", { locale: ptBR })}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell className="text-right font-medium">R$ {expense.amount}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(expense.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
