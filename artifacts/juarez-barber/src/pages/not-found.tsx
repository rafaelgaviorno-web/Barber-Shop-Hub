import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4 bg-card border-border">
        <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold">404 — Página não encontrada</h1>
          </div>
          <p className="text-muted-foreground">A página que você buscou não existe ou foi removida.</p>
          <Link href="/">
            <Button>Voltar ao início</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
