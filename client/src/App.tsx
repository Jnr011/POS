import React, { Suspense, useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import ErrorBoundary from './components/ErrorBoundary';
import { SplashScreen } from './components/SplashScreen';
import { PageLoading } from './components/PageLoading';
import { ConnectivityIndicator } from './components/ConnectivityIndicator';
import { useAuthStore } from './store/authStore';
import { useSync } from './hooks/useSync';
import AuthLayout from './layouts/AuthLayout';
import AppLayout from './layouts/AppLayout';
import Forbidden from './pages/Forbidden';
import NotFound from './pages/NotFound';
const Login = React.lazy(() => import('./pages/Login'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const SalesRepDashboard = React.lazy(() => import('./pages/SalesRepDashboard'));
const Sales = React.lazy(() => import('./pages/Sales'));
const SalesHistory = React.lazy(() => import('./pages/SalesHistory'));
const Inventory = React.lazy(() => import('./pages/Inventory'));
const Reports = React.lazy(() => import('./pages/Reports'));
const ReportsSales = React.lazy(() => import('./pages/ReportsSales'));
const ReportsProducts = React.lazy(() => import('./pages/ReportsProducts'));
const ReportsInventory = React.lazy(() => import('./pages/ReportsInventory'));
const ReportsActivity = React.lazy(() => import('./pages/ReportsActivity'));
const UserManagement = React.lazy(() => import('./pages/UserManagement'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Profile = React.lazy(() => import('./pages/Profile'));

function AppContent() {
  const { isAuthenticated, user } = useAuthStore();

  useSync();

  const DashboardRoute = () => {
    if (!isAuthenticated) return <Navigate to="/login" />;
    return user?.role === 'admin' ? <AdminDashboard /> : <SalesRepDashboard />;
  };

  const ProtectedLayout = () => {
    if (!isAuthenticated) return <Navigate to="/login" />;
    return <AppLayout />;
  };

  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={isAuthenticated ? <Navigate to={user?.role === 'admin' ? '/dashboard' : '/pos'} /> : <Login />} />
        </Route>

        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<DashboardRoute />} />
          <Route path="/sales" element={<SalesHistory />} />
          <Route path="/pos" element={<Sales />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/reports" element={user?.role === 'admin' ? <Reports /> : <Forbidden />} />
          <Route path="/reports/sales" element={user?.role === 'admin' ? <ReportsSales /> : <Forbidden />} />
          <Route path="/reports/products" element={user?.role === 'admin' ? <ReportsProducts /> : <Forbidden />} />
          <Route path="/reports/inventory" element={user?.role === 'admin' ? <ReportsInventory /> : <Forbidden />} />
          <Route path="/reports/activity" element={user?.role === 'admin' ? <ReportsActivity /> : <Forbidden />} />
          <Route path="/admin/users" element={user?.role === 'admin' ? <UserManagement /> : <Forbidden />} />
          <Route path="/admin/settings" element={user?.role === 'admin' ? <Settings /> : <Forbidden />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="/" element={<Navigate to={user?.role === 'admin' ? '/dashboard' : '/pos'} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 800);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) {
    return <SplashScreen minimumDuration={800} />;
  }

  return (
    <ErrorBoundary>
      <ConnectivityIndicator />
      <AppContent />
      <Toaster richColors position="top-right" />
    </ErrorBoundary>
  );
}

export default App;
