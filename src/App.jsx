// src/App.jsx - Updated with real components
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

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Route Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">
              There was an error loading this page. Please refresh and try again.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simple fallback component for pages that might have issues
const FallbackPage = ({ title, subtitle }) => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
    <p className="text-gray-600 mb-4">{subtitle}</p>
    <div className="bg-yellow-100 border border-yellow-300 rounded p-4">
      <p className="text-yellow-800">
        This page is temporarily showing a fallback version. The full component will be loaded once any issues are resolved.
      </p>
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, user, loading, userRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
        <span className="ml-3">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.includes(userRole);
    if (!hasRequiredRole) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
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
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Default route */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* Dashboard - accessible to all authenticated users */}
        <Route 
          path="dashboard" 
          element={<DashboardPage />}
        />
        
        {/* Products */}
        <Route 
          path="products" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'shop_manager', 'super_admin']}>
              <ErrorBoundary>
                <ProductsPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        
        {/* Orders */}
        <Route 
          path="orders" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'shop_manager', 'super_admin']}>
              <ErrorBoundary>
                <OrdersPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        
        {/* Users */}
        <Route 
          path="users" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
              <ErrorBoundary>
                <UsersPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        
        {/* Branches */}
        <Route 
          path="branches" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
              <ErrorBoundary>
                <BranchesPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        
        {/* Payments */}
        <Route 
          path="payments" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'shop_manager', 'super_admin']}>
              <ErrorBoundary>
                <PaymentsPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        
        {/* Reports */}
        <Route 
          path="reports" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'shop_manager', 'super_admin']}>
              <ErrorBoundary>
                <ReportsPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        
        {/* Inquiries */}
        <Route 
          path="inquiries" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'shop_manager', 'super_admin']}>
              <ErrorBoundary>
                <InquiriesPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        
        {/* Audit */}
        <Route 
          path="audit" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
              <ErrorBoundary>
                <AuditPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        
        {/* Settings */}
        <Route 
          path="settings" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'shop_manager', 'super_admin']}>
              <ErrorBoundary>
                <SettingsPage />
              </ErrorBoundary>
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