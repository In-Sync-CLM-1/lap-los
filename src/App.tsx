import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

// Pages
import { LoginPage } from "@/pages/Login";
import { RegisterPage } from "@/pages/Register";
import { Dashboard } from "@/pages/Dashboard";
import { LeadsList } from "@/pages/LeadsList";
import { LeadDetail } from "@/pages/LeadDetail";
import { NewLead } from "@/pages/NewLead";
import { ApplicationsList } from "@/pages/ApplicationsList";
import { ApplicationProcessing } from "@/pages/ApplicationProcessing";
import { Underwriting } from "@/pages/Underwriting";
import { Approvals } from "@/pages/Approvals";
import { Analytics } from "@/pages/Analytics";
import { Reports } from "@/pages/Reports";
import { Disbursal } from "@/pages/Disbursal";
import { Settings } from "@/pages/Settings";
import { UserManagement } from "@/pages/UserManagement";
import { Unauthorized } from "@/pages/Unauthorized";
import NotFound from "@/pages/NotFound";
import { ReferralApplication } from "@/pages/ReferralApplication";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <OnboardingProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/apply/:referralCode" element={<ReferralApplication />} />
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
              <Route path="/leads/:leadId" element={<LeadDetail />} />
              <Route path="/applications" element={<ApplicationsList />} />
              <Route path="/settings" element={<Settings />} />
              
              {/* Credit Officer + Management Routes */}
              <Route
                path="/underwriting"
                element={
                  <ProtectedRoute requiredRoles={['credit_officer', 'sales_manager', 'regional_head', 'zonal_head', 'ceo', 'admin']}>
                    <Underwriting />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/applications/:applicationId/process"
                element={
                  <ProtectedRoute requiredRoles={['credit_officer', 'sales_manager', 'regional_head', 'zonal_head', 'ceo', 'admin']}>
                    <ApplicationProcessing />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/applications/:applicationId/disbursal"
                element={
                  <ProtectedRoute requiredRoles={['credit_officer', 'sales_manager', 'regional_head', 'zonal_head', 'ceo', 'admin']}>
                    <Disbursal />
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
              <Route
                path="/reports"
                element={
                  <ProtectedRoute requiredRoles={['sales_manager', 'regional_head', 'zonal_head', 'ceo', 'admin']}>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              
              {/* Admin Only Routes */}
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
            </Route>
            
              {/* Redirects */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </OnboardingProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
