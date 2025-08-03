import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import AdminPortal from "@/pages/admin/admin-portal";
import EmployeePortal from "@/pages/employee/employee-portal";
import FamilyPortal from "@/pages/family/family-portal";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Switch>
      <Route path="/" component={() => {
        switch (user.role) {
          case 'admin':
            return <AdminPortal />;
          case 'employee':
            return <EmployeePortal />;
          case 'family':
            return <FamilyPortal />;
          default:
            return <NotFound />;
        }
      }} />
      <Route path="/admin" component={AdminPortal} />
      <Route path="/employee" component={EmployeePortal} />
      <Route path="/family" component={FamilyPortal} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <ErrorBoundary>
          <Router />
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

// Error Boundary Component to catch React errors
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
    
    // Clear any potentially problematic auth state
    localStorage.removeItem('healthcare_token');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-red-50">
          <div className="text-center p-8 bg-white rounded-lg shadow-xl max-w-md mx-4">
            <h1 className="text-2xl font-bold text-red-800 mb-4">Application Error</h1>
            <p className="text-red-600 mb-6">
              The application encountered an error and needs to restart.
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('healthcare_token');
                window.location.reload();
              }}
              className="bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700 transition-colors"
            >
              Restart Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default App;
