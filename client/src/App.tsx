import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BracketAdminProvider } from "@/context/BracketAdminContext";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import AdminDashboard from "@/pages/admin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BracketAdminProvider>
          <Toaster />
          <Router />
        </BracketAdminProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
