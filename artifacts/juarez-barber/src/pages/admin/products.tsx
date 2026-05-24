import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useListBarbershops, useListProducts, useCreateProduct, useUpdateProduct, useDeleteProduct,
  useListStockMovements, useCreateStockMovement, useGetLowStockProducts
} from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, AlertTriangle, TrendingUp, TrendingDown, RefreshCw, Package } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PRODUCT_CATEGORIES = ["Cabelo", "Barba", "Pele", "Higiene", "Equipamentos", "Outros"];
const PRODUCT_UNITS = ["un", "ml", "g", "kg", "L", "caixa", "pacote"];

const productSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  description: z.string().optional(),
  costPrice: z.coerce.number().min(0, "Custo deve ser positivo"),
  salePrice: z.coerce.number().min(0.01, "Preço de venda deve ser positivo"),
  quantity: z.coerce.number().min(0).default(0),
  minQuantity: z.coerce.number().min(0).default(5),
  unit: z.string().default("un"),
  category: z.string().default("Outros"),
});
type ProductFormValues = z.infer<typeof productSchema>;

const movementSchema = z.object({
  quantity: z.coerce.number().min(1, "Quantidade deve ser maior que 0"),
  type: z.enum(["entrada", "saida", "ajuste"]),
  description: z.string().optional(),
});
type MovementFormValues = z.infer<typeof movementSchema>;

export default function AdminProducts() {
  const { data: shops } = useListBarbershops();
  const shopId = shops?.[0]?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useListProducts(
    { barbershopId: shopId },
    { query: { enabled: !!shopId, queryKey: ["products", shopId] as any } }
  );
  const { data: lowStock } = useGetLowStockProducts(
    { barbershopId: shopId },
    { query: { enabled: !!shopId, queryKey: ["lowstock", shopId] as any } }
  );

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const createMovement = useCreateStockMovement();

  const [isProductOpen, setIsProductOpen] = useState(false);
  const [isMovementOpen, setIsMovementOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [movementTab, setMovementTab] = useState<string>("lista");

  const { data: movements } = useListStockMovements(
    selectedProductId || 0,
    { query: { enabled: !!selectedProductId } }
  );

  const productForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", description: "", costPrice: 0, salePrice: 0, quantity: 0, minQuantity: 5, unit: "un", category: "Outros" }
  });

  const movementForm = useForm<MovementFormValues>({
    resolver: zodResolver(movementSchema),
    defaultValues: { quantity: 1, type: "entrada", description: "" }
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    productForm.reset({ name: "", description: "", costPrice: 0, salePrice: 0, quantity: 0, minQuantity: 5, unit: "un", category: "Outros" });
    setIsProductOpen(true);
  };
  const handleOpenEdit = (p: any) => {
    setEditingId(p.id);
    productForm.reset({ name: p.name, description: p.description || "", costPrice: p.costPrice, salePrice: p.salePrice, quantity: p.quantity, minQuantity: p.minQuantity, unit: p.unit, category: p.category });
    setIsProductOpen(true);
  };
  const handleOpenMovement = (productId: number) => {
    setSelectedProductId(productId);
    movementForm.reset({ quantity: 1, type: "entrada", description: "" });
    setIsMovementOpen(true);
    setMovementTab("nova");
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["products", shopId] as any });
    queryClient.invalidateQueries({ queryKey: ["lowstock", shopId] as any });
  };

  const onSubmitProduct = async (data: ProductFormValues) => {
    if (!shopId) return;
    try {
      if (editingId) { await updateProduct.mutateAsync({ id: editingId, data }); toast({ title: "Produto atualizado" }); }
      else { await createProduct.mutateAsync({ data: { ...data, barbershopId: shopId } }); toast({ title: "Produto criado" }); }
      invalidate();
      setIsProductOpen(false);
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
  };

  const onSubmitMovement = async (data: MovementFormValues) => {
    if (!selectedProductId) return;
    try {
      await createMovement.mutateAsync({ id: selectedProductId, data });
      toast({ title: "Movimentação registrada" });
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["stock-movements", selectedProductId] });
      movementForm.reset({ quantity: 1, type: "entrada", description: "" });
      setMovementTab("lista");
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteProduct.mutateAsync({ id: deletingId });
      toast({ title: "Produto removido" });
      invalidate();
      setDeletingId(null);
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
  };

  const selectedProduct = products?.find(p => p.id === selectedProductId);
  const stockStatus = (p: any) => {
    if (p.quantity === 0) return "danger";
    if (p.quantity <= p.minQuantity) return "warning";
    return "ok";
  };

  const typeLabel: Record<string, string> = { entrada: "Entrada", saida: "Saída", ajuste: "Ajuste" };
  const typeColor: Record<string, string> = { entrada: "text-green-500", saida: "text-red-500", ajuste: "text-yellow-500" };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Estoque</h2>
            <p className="text-muted-foreground">Controle de produtos e movimentações de estoque.</p>
          </div>
          <Dialog open={isProductOpen} onOpenChange={setIsProductOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenAdd}><Plus className="h-4 w-4 mr-2" /> Novo Produto</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editingId ? "Editar Produto" : "Novo Produto"}</DialogTitle></DialogHeader>
              <Form {...productForm}>
                <form onSubmit={productForm.handleSubmit(onSubmitProduct)} className="space-y-4">
                  <FormField control={productForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} placeholder="ex: Pomada Modeladora" /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={productForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrição</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={productForm.control} name="category" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>{PRODUCT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={productForm.control} name="unit" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidade</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>{PRODUCT_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={productForm.control} name="costPrice" render={({ field }) => (<FormItem><FormLabel>Custo (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={productForm.control} name="salePrice" render={({ field }) => (<FormItem><FormLabel>Preço Venda (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={productForm.control} name="quantity" render={({ field }) => (<FormItem><FormLabel>Qtd. Inicial</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={productForm.control} name="minQuantity" render={({ field }) => (<FormItem><FormLabel>Qtd. Mínima</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={createProduct.isPending || updateProduct.isPending}>
                    {createProduct.isPending || updateProduct.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {(lowStock?.length ?? 0) > 0 && (
          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
              <div>
                <p className="font-medium text-yellow-500">{lowStock?.length} produto(s) com estoque baixo</p>
                <p className="text-sm text-muted-foreground">{lowStock?.map(p => p.name).join(", ")}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? <div>Carregando...</div> : products?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-xl bg-card text-muted-foreground gap-2">
            <Package className="h-12 w-12 opacity-30" />
            <p>Nenhum produto cadastrado. Clique em "Novo Produto" para começar.</p>
          </div>
        ) : (
          <Card className="bg-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                    <TableHead className="text-right">Venda</TableHead>
                    <TableHead className="text-center">Estoque</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products?.map((product) => {
                    const status = stockStatus(product);
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            {product.description && <div className="text-xs text-muted-foreground">{product.description}</div>}
                          </div>
                        </TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell className="text-right">R$ {product.costPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right">R$ {product.salePrice.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <span className={status === "danger" ? "text-red-500 font-bold" : status === "warning" ? "text-yellow-500 font-bold" : ""}>
                            {product.quantity} {product.unit}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {status === "danger" && <Badge variant="destructive">Sem estoque</Badge>}
                          {status === "warning" && <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Baixo</Badge>}
                          {status === "ok" && <Badge variant="outline" className="text-green-500 border-green-500/30">OK</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenMovement(product.id)} title="Movimentar estoque">
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(product)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeletingId(product.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Dialog open={isMovementOpen} onOpenChange={setIsMovementOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Movimentação de Estoque — {selectedProduct?.name}</DialogTitle>
            </DialogHeader>
            <Tabs value={movementTab} onValueChange={setMovementTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="nova">Nova Movimentação</TabsTrigger>
                <TabsTrigger value="lista">Histórico</TabsTrigger>
              </TabsList>
              <TabsContent value="nova" className="space-y-4 pt-4">
                <Form {...movementForm}>
                  <form onSubmit={movementForm.handleSubmit(onSubmitMovement)} className="space-y-4">
                    <FormField control={movementForm.control} name="type" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="entrada"><span className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-500" /> Entrada</span></SelectItem>
                            <SelectItem value="saida"><span className="flex items-center gap-2"><TrendingDown className="h-4 w-4 text-red-500" /> Saída</span></SelectItem>
                            <SelectItem value="ajuste"><span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 text-yellow-500" /> Ajuste</span></SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={movementForm.control} name="quantity" render={({ field }) => (<FormItem><FormLabel>Quantidade</FormLabel><FormControl><Input type="number" min="1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={movementForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Observação</FormLabel><FormControl><Input {...field} placeholder="ex: Compra fornecedor, uso interno..." /></FormControl><FormMessage /></FormItem>)} />
                    <Button type="submit" className="w-full" disabled={createMovement.isPending}>{createMovement.isPending ? "Registrando..." : "Registrar"}</Button>
                  </form>
                </Form>
              </TabsContent>
              <TabsContent value="lista" className="pt-2">
                {!movements?.length ? (
                  <div className="text-center text-muted-foreground py-8">Nenhuma movimentação registrada.</div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {movements?.map(m => (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <span className={`font-medium ${typeColor[m.type]}`}>{typeLabel[m.type]}</span>
                          {m.description && <p className="text-xs text-muted-foreground">{m.description}</p>}
                          <p className="text-xs text-muted-foreground">{format(new Date(m.createdAt), "d MMM yyyy, HH:mm", { locale: ptBR })}</p>
                        </div>
                        <span className={`font-bold text-lg ${m.type === "saida" ? "text-red-500" : "text-green-500"}`}>
                          {m.type === "saida" ? "-" : "+"}{m.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>O produto e todo o seu histórico de movimentações serão removidos permanentemente.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{deleteProduct.isPending ? "Removendo..." : "Remover"}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
