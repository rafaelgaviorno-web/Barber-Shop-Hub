import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { LogOut, Home, User as UserIcon, Calendar, Briefcase, Scissors, CreditCard, PieChart, Package, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useListNotifications } from "@workspace/api-client-react";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const { data: notifications } = useListNotifications(
    { query: { refetchInterval: 30000 } }
  );
  const unreadCount = notifications?.filter(n => !n.read).length ?? 0;

  if (!user || user.role !== "admin") {
    setLocation("/login");
    return null;
  }

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const navItems = [
    { href: "/admin", label: "Painel", icon: Home },
    { href: "/admin/barbershop", label: "Minha Barbearia", icon: Briefcase },
    { href: "/admin/barbers", label: "Barbeiros", icon: UserIcon },
    { href: "/admin/services", label: "Serviços", icon: Scissors },
    { href: "/admin/appointments", label: "Agendamentos", icon: Calendar },
    { href: "/admin/sales", label: "Vendas", icon: CreditCard },
    { href: "/admin/expenses", label: "Despesas", icon: CreditCard },
    { href: "/admin/products", label: "Estoque", icon: Package },
    { href: "/admin/financial", label: "Financeiro", icon: PieChart },
    { href: "/admin/notifications", label: "Notificações", icon: Bell, badge: unreadCount },
  ];

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold text-primary tracking-tight">JUAREZ BARBER</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Painel Admin</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors ${isActive ? "bg-accent text-accent-foreground" : ""}`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="mb-4">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
