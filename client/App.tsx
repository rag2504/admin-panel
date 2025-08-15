import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminProvider, useAdmin } from "@/contexts/AdminContext";
import AdminLayout from "@/components/AdminLayout";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminGrounds from "./pages/AdminGrounds";
import AdminFinancial from "./pages/AdminFinancial";
import AdminLocations from "./pages/AdminLocations";
import AdminBookings from "./pages/AdminBookings";

const queryClient = new QueryClient();

// Protected Admin Route Component
function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAdmin();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
}

// Admin Routes Component
function AdminRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/dashboard" element={
        <ProtectedAdminRoute>
          <AdminDashboard />
        </ProtectedAdminRoute>
      } />
      <Route path="/users" element={
        <ProtectedAdminRoute>
          <AdminUsers />
        </ProtectedAdminRoute>
      } />
      <Route path="/grounds" element={
        <ProtectedAdminRoute>
          <AdminGrounds />
        </ProtectedAdminRoute>
      } />
      <Route path="/financial" element={
        <ProtectedAdminRoute>
          <AdminFinancial />
        </ProtectedAdminRoute>
      } />
      <Route path="/locations" element={
        <ProtectedAdminRoute>
          <AdminLocations />
        </ProtectedAdminRoute>
      } />
      <Route path="/bookings" element={
        <ProtectedAdminRoute>
          <AdminBookings />
        </ProtectedAdminRoute>
      } />
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AdminProvider>
          <Routes>
            {/* Redirect root to admin */}
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            
            {/* Admin Routes */}
            <Route path="/admin/*" element={<AdminRoutes />} />
            
            {/* Legacy routes - redirect to admin */}
            <Route path="/home" element={<Index />} />
            
            {/* Catch all - redirect to admin */}
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </AdminProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
