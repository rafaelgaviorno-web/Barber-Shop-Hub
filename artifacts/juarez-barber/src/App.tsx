import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import BarbershopsList from "@/pages/barbershops/list";
import BarbershopDetail from "@/pages/barbershops/detail";
import BookAppointment from "@/pages/book";
import MyAppointments from "@/pages/my-appointments";

import AdminDashboard from "@/pages/admin/dashboard";
import AdminBarbershop from "@/pages/admin/barbershop";
import AdminBarbers from "@/pages/admin/barbers";
import AdminServices from "@/pages/admin/services";
import AdminAppointments from "@/pages/admin/appointments";
import AdminSales from "@/pages/admin/sales";
import AdminExpenses from "@/pages/admin/expenses";
import AdminFinancial from "@/pages/admin/financial";
import { AdminLayout } from "@/components/layout/AdminLayout";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Client Routes */}
      <Route path="/barbershops" component={BarbershopsList} />
      <Route path="/barbershops/:id" component={BarbershopDetail} />
      <Route path="/book/:barbershopId" component={BookAppointment} />
      <Route path="/my-appointments" component={MyAppointments} />
      
      {/* Admin routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/barbershop" component={AdminBarbershop} />
      <Route path="/admin/barbers" component={AdminBarbers} />
      <Route path="/admin/services" component={AdminServices} />
      <Route path="/admin/appointments" component={AdminAppointments} />
      <Route path="/admin/sales" component={AdminSales} />
      <Route path="/admin/expenses" component={AdminExpenses} />
      <Route path="/admin/financial" component={AdminFinancial} />
      
      {/* Catch-all for undefined routes */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
