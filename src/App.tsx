import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

// Pages
import { LoginPage } from "@/pages/Login";
import { RegisterPage } from "@/pages/Register";
import { Dashboard } from "@/pages/Dashboard";
import { LeadsList } from "@/pages/LeadsList";
import { NewLead } from "@/pages/NewLead";
import { ApplicationsList } from "@/pages/ApplicationsList";
import { Underwriting } from "@/pages/Underwriting";
import { Approvals } from "@/pages/Approvals";
import { Analytics } from "@/pages/Analytics";
import { Unauthorized } from "@/pages/Unauthorized";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Protected Routes with Layout */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/leads" element={<LeadsList />} />
              <Route path="/leads/new" element={<NewLead />} />
              <Route path="/applications" element={<ApplicationsList />} />
              
              {/* Credit Officer + Management Routes */}
              <Route
                path="/underwriting"
                element={
                  <ProtectedRoute requiredRoles={['credit_officer', 'sales_manager', 'regional_head', 'zonal_head', 'ceo', 'admin']}>
                    <Underwriting />
                  </ProtectedRoute>
                }
              />
              
              {/* Management Only Routes */}
              <Route
                path="/approvals"
                element={
                  <ProtectedRoute requiredRoles={['sales_manager', 'regional_head', 'zonal_head', 'ceo', 'admin']}>
                    <Approvals />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute requiredRoles={['sales_manager', 'regional_head', 'zonal_head', 'ceo', 'admin']}>
                    <Analytics />
                  </ProtectedRoute>
                }
              />
            </Route>
            
            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
