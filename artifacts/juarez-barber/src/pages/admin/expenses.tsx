import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { 
  useListBarbershops, 
  useListExpenses, 
  useCreateExpense, 
  useDeleteExpense
} from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const expenseSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be positive"),
  description: z.string().min(2, "Description is required"),
  category: z.string().min(1, "Category is required"),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

const EXPENSE_CATEGORIES = ["Rent", "Utilities", "Supplies", "Marketing", "Maintenance", "Other"];

export default function AdminExpenses() {
  const { data: shops } = useListBarbershops();
  const shopId = shops?.[0]?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: expenses, isLoading } = useListExpenses(
    { barbershopId: shopId },
    { query: { enabled: !!shopId, queryKey: ['expenses', { barbershopId: shopId }] as any } }
  );

  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();

  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      description: "",
      category: "",
    }
  });

  const handleOpenAdd = () => {
    form.reset({
      amount: 0,
      description: "",
      category: "",
    });
    setIsOpen(true);
  };

  const onSubmit = async (data: ExpenseFormValues) => {
    if (!shopId) return;

    try {
      await createExpense.mutateAsync({ data: { ...data, barbershopId: shopId } });
      toast({ title: "Expense recorded" });
      queryClient.invalidateQueries({ queryKey: ['expenses', { barbershopId: shopId }] as any });
      setIsOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!shopId) return;
    try {
      await deleteExpense.mutateAsync({ id });
      toast({ title: "Expense deleted" });
      queryClient.invalidateQueries({ queryKey: ['expenses', { barbershopId: shopId }] as any });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Expenses</h2>
            <p className="text-muted-foreground">Track barbershop outgoings.</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenAdd}><Plus className="h-4 w-4 mr-2" /> Add Expense</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record New Expense</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Electric Bill" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount ($)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {EXPENSE_CATEGORIES.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createExpense.isPending}>
                    {createExpense.isPending ? "Saving..." : "Save Expense"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-card">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : expenses?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No expenses recorded.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses?.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{format(new Date(expense.createdAt), "MMM d, yyyy h:mm a")}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell className="text-right font-medium">${expense.amount}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(expense.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
