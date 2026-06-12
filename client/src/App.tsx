import React, { useEffect, useState } from 'react';
import { Toaster } from './components/ui/sonner';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuthStore } from './store/authStore';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSync } from './hooks/useSync';
import { seedDatabase } from './db/seed';
import AuthLayout from './layouts/AuthLayout';
import AppLayout from './layouts/AppLayout';
import AdminDashboard from './pages/AdminDashboard';
import SalesRepDashboard from './pages/SalesRepDashboard';
import Sales from './pages/Sales';
import Login from './pages/Login';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';

function AppContent() {
  const { isAuthenticated, user } = useAuthStore();
  const [seeding, setSeeding] = useState(true);

  useEffect(() => {
    seedDatabase().then(() => setSeeding(false));
  }, []);

  useSync();

  if (seeding) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const DashboardRoute = () => {
    if (!isAuthenticated) return <Navigate to="/login" />;
    return user?.role === 'admin' ? <AdminDashboard /> : <SalesRepDashboard />;
  };

  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={isAuthenticated ? <Navigate to={user?.role === 'admin' ? '/dashboard' : '/sales'} /> : <Login />} />
      </Route>

      <Route element={isAuthenticated ? <AppLayout /> : <Navigate to="/login" />}>
        <Route path="/dashboard" element={<DashboardRoute />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/reports" element={user?.role === 'admin' ? <Reports /> : <Navigate to="/dashboard" />} />
      </Route>

      <Route path="/" element={<Navigate to={user?.role === 'admin' ? '/dashboard' : '/sales'} />} />
      <Route path="*" element={<Navigate to={user?.role === 'admin' ? '/dashboard' : '/sales'} />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
      <Toaster richColors position="top-right" />
    </ErrorBoundary>
  );
}

export default App;
