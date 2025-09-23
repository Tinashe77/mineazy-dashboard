// src/App.jsx - Updated with better loading states
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/layout';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { OrdersPage } from './pages/OrdersPage';
import { UsersPage } from './pages/UsersPage';
import { ShopManagersPage } from './pages/ShopManagersPage';
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

// Protected Route Component
const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, user, loading, userRole } = useAuth();

  // Show loading spinner while auth state is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600">Checking authentication...</span>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check role requirements
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.includes(userRole);
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">
              You don't have permission to access this page.
            </p>
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
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
  const { isAuthenticated, loading } = useAuth();

  // Show loading during initial auth check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600">Loading application...</span>
        </div>
      </div>
    );
  }

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
              <ProductsPage />
            </ProtectedRoute>
          }
        />
        
        {/* Orders */}
        <Route 
          path="orders" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'shop_manager', 'super_admin']}>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        
        {/* Users */}
        <Route 
          path="users" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        
        {/* Shop Managers */}
        <Route
          path="shop-managers"
          element={
            <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
              <ShopManagersPage />
            </ProtectedRoute>
          }
        />

        {/* Branches */}
        <Route 
          path="branches" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
              <BranchesPage />
            </ProtectedRoute>
          }
        />
        
        {/* Payments */}
        <Route 
          path="payments" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'shop_manager', 'super_admin']}>
              <PaymentsPage />
            </ProtectedRoute>
          }
        />
        
        {/* Reports */}
        <Route 
          path="reports" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'shop_manager', 'super_admin']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        
        {/* Inquiries */}
        <Route 
          path="inquiries" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'shop_manager', 'super_admin']}>
              <InquiriesPage />
            </ProtectedRoute>
          }
        />
        
        {/* Audit */}
        <Route 
          path="audit" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
              <AuditPage />
            </ProtectedRoute>
          }
        />
        
        {/* Settings */}
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