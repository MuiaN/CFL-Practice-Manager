import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useState, useEffect } from "react";

import LoginPage from "@/components/LoginPage";
import AppSidebar from "@/components/AppSidebar";
import DashboardPage from "@/components/DashboardPage";
import CasesPage from "@/components/CasesPage";
import DocumentsPage from "@/components/DocumentsPage";
import AdminUsersPage from "@/components/AdminUsersPage";
import RoleManagementPage from "@/components/RoleManagementPage";
import PracticeAreaManagementPage from "@/components/PracticeAreaManagementPage";
import CaseDetailsPage from "@/components/CaseDetailsPage";
import ThemeToggle from "@/components/ThemeToggle";
import NotFound from "@/pages/not-found";
import { getCurrentUser, getToken, type AuthUser } from "@/lib/auth";

function AuthenticatedLayout({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar user={user} onLogout={onLogout} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between h-16 px-6 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-8 bg-background">
            <Switch>
              <Route path="/" component={DashboardPage} />
              <Route path="/dashboard" component={DashboardPage} />
              <Route path="/cases" component={CasesPage} />
              <Route path="/cases/:id" component={CaseDetailsPage} />
              <Route path="/documents" component={DocumentsPage} />
              <Route path="/admin/users" component={AdminUsersPage} />
              <Route path="/admin/roles" component={RoleManagementPage} />
              <Route path="/admin/practice-areas" component={PracticeAreaManagementPage} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const { data: user, isLoading, isError } = useQuery<AuthUser>({
    queryKey: ["/api/auth/me"],
    enabled: isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    const token = getToken();
    if (token) {
      setIsAuthenticated(true);
    }
    setIsCheckingAuth(false);
  }, []);

  // If token is invalid/expired, clear it and force re-login
  useEffect(() => {
    if (isError) {
      localStorage.removeItem("auth_token");
      setIsAuthenticated(false);
    }
  }, [isError]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    queryClient.clear();
    setIsAuthenticated(false);
  };

  if (isCheckingAuth || (isAuthenticated && isLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || isError) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <AuthenticatedLayout user={user} onLogout={handleLogout} />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
