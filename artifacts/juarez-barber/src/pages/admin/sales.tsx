import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { 
  useListBarbershops, 
  useListSales, 
  useCreateSale, 
  useDeleteSale,
  useListBarbers
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

const saleSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be positive"),
  description: z.string().min(2, "Description is required"),
  barberId: z.coerce.number().min(1, "Barber is required"),
});

type SaleFormValues = z.infer<typeof saleSchema>;

export default function AdminSales() {
  const { data: shops } = useListBarbershops();
  const shopId = shops?.[0]?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sales, isLoading } = useListSales(
    { barbershopId: shopId },
    { query: { enabled: !!shopId, queryKey: ['sales', { barbershopId: shopId }] as any } }
  );

  const { data: barbers } = useListBarbers(
    shopId || 0,
    { query: { enabled: !!shopId, queryKey: ['barbers', shopId] as any } }
  );

  const createSale = useCreateSale();
  const deleteSale = useDeleteSale();

  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      amount: 0,
      description: "",
    }
  });

  const handleOpenAdd = () => {
    form.reset({
      amount: 0,
      description: "",
    });
    setIsOpen(true);
  };

  const onSubmit = async (data: SaleFormValues) => {
    if (!shopId) return;

    try {
      await createSale.mutateAsync({ data: { ...data, barbershopId: shopId } });
      toast({ title: "Sale recorded" });
      queryClient.invalidateQueries({ queryKey: ['sales', { barbershopId: shopId }] as any });
      setIsOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!shopId) return;
    try {
      await deleteSale.mutateAsync({ id });
      toast({ title: "Sale deleted" });
      queryClient.invalidateQueries({ queryKey: ['sales', { barbershopId: shopId }] as any });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Sales</h2>
            <p className="text-muted-foreground">Record manual sales and products.</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenAdd}><Plus className="h-4 w-4 mr-2" /> Add Sale</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record New Sale</DialogTitle>
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
                          <Input {...field} placeholder="e.g. Hair Product" />
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
                    name="barberId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Attributed Barber</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a barber" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {barbers?.map(b => (
                              <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createSale.isPending}>
                    {createSale.isPending ? "Saving..." : "Save Sale"}
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
            ) : sales?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No sales recorded.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Barber</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales?.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{format(new Date(sale.createdAt), "MMM d, yyyy h:mm a")}</TableCell>
                      <TableCell>{sale.description}</TableCell>
                      <TableCell>{sale.barberName}</TableCell>
                      <TableCell className="text-right font-medium">${sale.amount}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(sale.id)}>
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
