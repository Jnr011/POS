
import React from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { ToastProvider } from './components/Toast';
import { useAuthStore } from './store/authStore';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import SalesRepDashboard from './pages/SalesRepDashboard';
import Sales from './pages/Sales';
import Login from './pages/Login';
import Register from './pages/Register';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';

function App() {
  const { isAuthenticated, user, logout } = useAuthStore();

  const DashboardRoute = () => {
    if (!isAuthenticated) return <Navigate to="/login" />;
    return user?.role === 'admin' ? <AdminDashboard /> : <SalesRepDashboard />;
  };

  return (
    <ToastProvider>
      <div className="App">
        {isAuthenticated && <Navbar onLogout={logout} />}
        <div className="app-content">
          {isAuthenticated && <Sidebar userRole={user?.role} />}
          <div className="main-content">
            <Routes>
            <Route 
              path="/login" 
              element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
            />
            <Route 
              path="/register" 
              element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />}
            />
            <Route 
              path="/dashboard" 
              element={<DashboardRoute />}
            />
            <Route 
              path="/admin-dashboard" 
              element={isAuthenticated && user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />}
            />
            <Route 
              path="/sales-dashboard" 
              element={isAuthenticated && user?.role === 'sales' ? <SalesRepDashboard /> : <Navigate to="/login" />}
            />
            <Route 
              path="/sales" 
              element={isAuthenticated ? <Sales /> : <Navigate to="/login" />}
            />
            <Route 
              path="/inventory" 
              element={isAuthenticated ? <Inventory /> : <Navigate to="/login" />}
            />
            <Route 
              path="/reports" 
              element={isAuthenticated && user?.role === 'admin' ? <Reports /> : <Navigate to="/login" />}
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </div>
    </div>
    </ToastProvider>
  );
}

export default App;
