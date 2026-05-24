import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { LogOut, Home, User as UserIcon, Calendar, Briefcase, Scissors, CreditCard, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  if (!user || user.role !== "admin") {
    setLocation("/login");
    return null;
  }

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: Home },
    { href: "/admin/barbershop", label: "My Barbershop", icon: Briefcase },
    { href: "/admin/barbers", label: "Barbers", icon: UserIcon },
    { href: "/admin/services", label: "Services", icon: Scissors },
    { href: "/admin/appointments", label: "Appointments", icon: Calendar },
    { href: "/admin/sales", label: "Sales", icon: CreditCard },
    { href: "/admin/expenses", label: "Expenses", icon: CreditCard },
    { href: "/admin/financial", label: "Financials", icon: PieChart },
  ];

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold text-primary tracking-tight">JUAREZ BARBER</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Admin Panel</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors">
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="mb-4">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
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
