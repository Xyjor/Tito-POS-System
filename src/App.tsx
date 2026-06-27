import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { CartProvider } from "./context/CartContext";
import { ToastProvider } from "./context/ToastContext";
import { PosPage } from "./pages/PosPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DemoBanner } from "./components/DemoBanner";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
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
    <>
      <DemoBanner />
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<ProtectedRoute><PosPage /></ProtectedRoute>} />
          <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}

function App() {
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
