import React, { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { CartProvider } from "./context/CartContext";
import { ToastProvider } from "./context/ToastContext";
import { PosPage } from "./pages/PosPage";
import { ProductsPage } from "./pages/ProductsPage";
import { SalesPage } from "./pages/SalesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { AccountsPage } from "./pages/AccountsPage";
import { AuthProvider, useAuth } from "./context/AuthContext";

function ProtectedRoute({ children, adminOnly = false, requireProductAccess = false }: { children: React.ReactNode, adminOnly?: boolean, requireProductAccess?: boolean }) {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  if (requireProductAccess && user.role !== 'admin' && !user.can_manage_products) return <Navigate to="/" replace />;
  
  return <>{children}</>;
}

function AppContent() {
  const { user } = useAuth();
  
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<ProtectedRoute><PosPage /></ProtectedRoute>} />
        <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="products" element={<ProtectedRoute requireProductAccess><ProductsPage /></ProtectedRoute>} />
        <Route path="sales" element={<ProtectedRoute><SalesPage /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute adminOnly><SettingsPage /></ProtectedRoute>} />
        <Route path="accounts" element={<ProtectedRoute adminOnly><AccountsPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  useEffect(() => {
    // Hide the splashscreen and show main window once React is ready
    setTimeout(() => {
      invoke('close_splashscreen').catch(console.error);
    }, 500); // Small 500ms delay to ensure seamless transition
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
