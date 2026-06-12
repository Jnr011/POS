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
import SalesHistory from './pages/SalesHistory';
import Login from './pages/Login';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import ReportsSales from './pages/ReportsSales';
import ReportsProducts from './pages/ReportsProducts';
import ReportsInventory from './pages/ReportsInventory';
import ReportsActivity from './pages/ReportsActivity';
import UserManagement from './pages/UserManagement';

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
        <Route path="/login" element={isAuthenticated ? <Navigate to={user?.role === 'admin' ? '/dashboard' : '/pos'} /> : <Login />} />
      </Route>

      <Route element={isAuthenticated ? <AppLayout /> : <Navigate to="/login" />}>
        <Route path="/dashboard" element={<DashboardRoute />} />
        <Route path="/sales" element={<SalesHistory />} />
        <Route path="/pos" element={<Sales />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/reports" element={user?.role === 'admin' ? <Reports /> : <Navigate to="/dashboard" />} />
        <Route path="/reports/sales" element={user?.role === 'admin' ? <ReportsSales /> : <Navigate to="/dashboard" />} />
        <Route path="/reports/products" element={user?.role === 'admin' ? <ReportsProducts /> : <Navigate to="/dashboard" />} />
        <Route path="/reports/inventory" element={user?.role === 'admin' ? <ReportsInventory /> : <Navigate to="/dashboard" />} />
        <Route path="/reports/activity" element={user?.role === 'admin' ? <ReportsActivity /> : <Navigate to="/dashboard" />} />
        <Route path="/admin/users" element={user?.role === 'admin' ? <UserManagement /> : <Navigate to="/dashboard" />} />
      </Route>

      <Route path="/" element={<Navigate to={user?.role === 'admin' ? '/dashboard' : '/pos'} />} />
      <Route path="*" element={<Navigate to={user?.role === 'admin' ? '/dashboard' : '/pos'} />} />
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
