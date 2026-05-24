import { useListBarbershops } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function BarbershopsList() {
  const { data: barbershops, isLoading } = useListBarbershops();

  return (
    <ClientLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Barbearias</h2>
          <p className="text-muted-foreground">Selecione uma barbearia para agendar seu atendimento.</p>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="overflow-hidden">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent><Skeleton className="h-10 w-full" /></CardContent>
              </Card>
            ))}
          </div>
        ) : barbershops?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-xl bg-card text-muted-foreground">
            <p>Nenhuma barbearia disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {barbershops?.map((shop) => (
              <Card key={shop.id} className="overflow-hidden border-border bg-card hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle>{shop.name}</CardTitle>
                  <CardDescription className="flex flex-col gap-1 mt-2">
                    {shop.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {shop.address}</span>}
                    {(shop.openTime || shop.closeTime) && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {shop.openTime} - {shop.closeTime}</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{shop.description || "Serviços premium de barbearia."}</p>
                  <Link href={`/barbershops/${shop.id}`}>
                    <Button className="w-full">Ver Detalhes</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
