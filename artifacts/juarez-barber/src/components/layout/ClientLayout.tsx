import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { LogOut, Calendar, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary tracking-tight">
            JUAREZ BARBER
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/barbershops" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
              <Scissors className="h-4 w-4" />
              Barbershops
            </Link>
            {user ? (
              <Link href="/my-appointments" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                My Appointments
              </Link>
            ) : null}
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground hidden sm:inline-block">Welcome, {user.name}</span>
                {user.role === "admin" && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm">Admin</Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Log In</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Register</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
