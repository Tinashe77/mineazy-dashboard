// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/layout';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { OrdersPage } from './pages/OrdersPage';
import { UsersPage } from './pages/UsersPage';
import { BranchesPage } from './pages/BranchesPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { ReportsPage } from './pages/ReportsPage';
import { InquiriesPage } from './pages/InquiriesPage';
import { AuditPage } from './pages/AuditPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoadingSpinner } from './components/ui';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// App Routes Component
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        } 
      />

      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        <Route 
          path="dashboard" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'shop_manager', 'super_admin']}>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="products" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'shop_manager', 'super_admin']}>
              <ProductsPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="orders" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'shop_manager', 'super_admin']}>
              <OrdersPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="users" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
              <UsersPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="branches" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
              <BranchesPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="payments" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'shop_manager', 'super_admin']}>
              <PaymentsPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="reports" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'shop_manager', 'super_admin']}>
              <ReportsPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="inquiries" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'shop_manager', 'super_admin']}>
              <InquiriesPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="audit" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
              <AuditPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="settings" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'shop_manager', 'super_admin']}>
              <SettingsPage />
            </ProtectedRoute>
          } 
        />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

// Main App Component
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
