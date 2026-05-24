import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Scissors, Star, Clock } from "lucide-react";

export default function Home() {
  return (
    <ClientLayout>
      <div className="flex flex-col items-center text-center pb-20 px-4 max-w-5xl mx-auto space-y-12">
        <div className="w-full relative rounded-2xl overflow-hidden shadow-2xl mb-8 border border-border">
          <div className="absolute inset-0 bg-black/40 z-10"></div>
          <img src="/hero-barber.png" alt="Interior Premium da Barbearia" className="w-full h-[60vh] object-cover object-center" />
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-white">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tighter text-white mb-4 drop-shadow-lg">
              A Arte do <span className="text-primary">Cuidado</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
              Barbearias profissionais com cortes excepcionais, aparos de barba e finalização. Agende seu próximo atendimento com tranquilidade.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full sm:w-auto">
              <Link href="/barbershops">
                <Button size="lg" className="w-full sm:w-auto text-base h-12 px-8">
                  Encontrar Barbearia
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base h-12 px-8 bg-black/50 text-white border-white/20 hover:bg-black/70 hover:text-white">
                  Criar Conta
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-12">
          <div className="flex flex-col items-center space-y-3 p-8 bg-card border border-border rounded-xl shadow-sm hover:border-primary/30 transition-colors">
            <div className="p-4 bg-primary/10 rounded-full text-primary mb-2">
              <Scissors className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold">Barbeiros Experts</h3>
            <p className="text-muted-foreground text-sm text-center">Profissionais dedicados ao seu ofício e ao seu visual.</p>
          </div>
          <div className="flex flex-col items-center space-y-3 p-8 bg-card border border-border rounded-xl shadow-sm hover:border-primary/30 transition-colors">
            <div className="p-4 bg-primary/10 rounded-full text-primary mb-2">
              <Clock className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold">Agendamento Fácil</h3>
            <p className="text-muted-foreground text-sm text-center">Agendamento online simples. Escolha horário, serviço e barbeiro.</p>
          </div>
          <div className="flex flex-col items-center space-y-3 p-8 bg-card border border-border rounded-xl shadow-sm hover:border-primary/30 transition-colors">
            <div className="p-4 bg-primary/10 rounded-full text-primary mb-2">
              <Star className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold">Experiência Premium</h3>
            <p className="text-muted-foreground text-sm text-center">Mais do que um corte. Um momento de cuidado no seu dia a dia.</p>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
