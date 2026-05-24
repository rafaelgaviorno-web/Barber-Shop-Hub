import { useLocation, useParams } from "wouter";
import { useGetBarbershop, useListBarbers, useListServices } from "@workspace/api-client-react";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Phone, Scissors, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function BarbershopDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  const [, setLocation] = useLocation();

  const { data: shop, isLoading: shopLoading } = useGetBarbershop(id);
  const { data: barbers, isLoading: barbersLoading } = useListBarbers(id);
  const { data: services, isLoading: servicesLoading } = useListServices(id);

  if (shopLoading) return <ClientLayout><div className="flex items-center justify-center h-64">Carregando...</div></ClientLayout>;
  if (!shop) return <ClientLayout><div className="text-center py-12">Barbearia não encontrada.</div></ClientLayout>;

  return (
    <ClientLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">{shop.name}</h1>
            <div className="flex flex-wrap gap-4 mt-4 text-muted-foreground">
              {shop.address && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {shop.address}</span>}
              {shop.phone && <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> {shop.phone}</span>}
              {(shop.openTime || shop.closeTime) && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {shop.openTime} - {shop.closeTime}</span>}
            </div>
            {shop.description && <p className="mt-4 text-lg">{shop.description}</p>}
          </div>
          <Button size="lg" onClick={() => setLocation(`/book/${id}`)} className="text-lg px-8">
            Agendar Horário
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Scissors className="h-6 w-6 text-primary" /> Serviços
            </h2>
            {servicesLoading ? <div>Carregando serviços...</div> : services?.length === 0 ? (
              <div className="text-muted-foreground p-4 bg-card rounded-md border border-border">Nenhum serviço cadastrado.</div>
            ) : (
              <div className="space-y-3">
                {services?.map(service => (
                  <Card key={service.id} className="bg-card">
                    <CardHeader className="py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{service.name}</CardTitle>
                          <CardDescription className="mt-1">{service.description}</CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">R$ {service.price}</div>
                          <Badge variant="outline" className="mt-1">{service.durationMinutes} min</Badge>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <User className="h-6 w-6 text-primary" /> Barbeiros
            </h2>
            {barbersLoading ? <div>Carregando barbeiros...</div> : barbers?.length === 0 ? (
              <div className="text-muted-foreground p-4 bg-card rounded-md border border-border">Nenhum barbeiro cadastrado.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {barbers?.map(barber => (
                  <Card key={barber.id} className="bg-card">
                    <CardHeader className="py-4">
                      <CardTitle className="text-lg">{barber.name}</CardTitle>
                      {barber.specialties && <CardDescription className="mt-1">{barber.specialties}</CardDescription>}
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
