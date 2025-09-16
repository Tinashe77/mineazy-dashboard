// src/pages/DashboardPage.jsx - Working version with error handling
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, Badge, LoadingSpinner, Alert, Button } from '../components/ui';
import { formatCurrency, formatDate } from '../utils';
import api from '../services/api';
import {
  Package,
  ShoppingCart,
  Building2,
  DollarSign,
  Users,
  AlertTriangle,
  Clock,
  RefreshCw,
  TrendingUp
} from 'lucide-react';

export const DashboardPage = () => {
  const { user, userRole } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalProducts: 0,
      totalOrders: 0,
      totalBranches: 0,
      totalUsers: 0,
      totalRevenue: 0
    },
    recentOrders: [],
    lowStockProducts: [],
    loading: true,
    error: null
  });

  const loadDashboardData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));

      // Load data based on user role
      const promises = [];
      
      // Everyone can see products and branches
      promises.push(
        api.getProducts({ limit: 100 }).catch(err => ({ data: [] })),
        api.getBranches().catch(err => ({ data: [] }))
      );

      // Managers and admins can see orders and users
      if (['admin', 'super_admin', 'shop_manager'].includes(userRole)) {
        promises.push(
          api.getOrders({ limit: 50 }).catch(err => ({ data: [] })),
          api.getUsers({ limit: 20 }).catch(err => ({ data: [] }))
        );
      }

      const results = await Promise.all(promises);
      
      const products = results[0]?.data || [];
      const branches = results[1]?.data || [];
      const orders = results[2]?.data || [];
      const users = results[3]?.data || [];

      const totalRevenue = orders.reduce((sum, order) => 
        sum + (order.total || order.totalAmount || 0), 0
      );

      const lowStockProducts = products.filter(product => {
        const stock = product.stock?.quantity || product.stock || 0;
        return stock < 5;
      }).slice(0, 5);

      setDashboardData({
        stats: {
          totalProducts: products.length,
          totalOrders: orders.length,
          totalBranches: branches.length,
          totalUsers: users.length,
          totalRevenue
        },
        recentOrders: orders.slice(0, 5),
        lowStockProducts,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Dashboard data loading error:', error);
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load dashboard data'
      }));
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [userRole]);

  const { stats, recentOrders, lowStockProducts, loading, error } = dashboardData;

  // Define stat cards based on user role
  const getStatCards = () => {
    const baseCards = [
      {
        title: 'Total Products',
        value: stats.totalProducts,
        icon: Package,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100'
      },
      {
        title: 'Active Branches',
        value: stats.totalBranches,
        icon: Building2,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100'
      }
    ];

    if (['admin', 'super_admin', 'shop_manager'].includes(userRole)) {
      baseCards.push(
        {
          title: 'Total Orders',
          value: stats.totalOrders,
          icon: ShoppingCart,
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        },
        {
          title: 'Total Revenue',
          value: formatCurrency(stats.totalRevenue),
          icon: DollarSign,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100'
        }
      );
    }

    if (['admin', 'super_admin'].includes(userRole)) {
      baseCards.push({
        title: 'Total Users',
        value: stats.totalUsers,
        icon: Users,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100'
      });
    }

    return baseCards;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name || 'User'}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here's what's happening with your mining equipment business today.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setDashboardData(prev => ({ ...prev, error: null }))}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getStatCards().map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-md ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders - Only for managers and admins */}
        {['admin', 'super_admin', 'shop_manager'].includes(userRole) && (
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Recent Orders
              </h3>
            </div>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order, index) => (
                    <div key={order.id || order._id || index} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Order #{(order.id || order._id || '').slice(-8).toUpperCase()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.customer || order.user?.name || 'Unknown Customer'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(order.total || order.totalAmount || 0)}
                          </p>
                          <Badge variant={order.status === 'completed' ? 'success' : 'warning'}>
                            {order.status || 'pending'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center text-gray-500">
                    <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No recent orders found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Low Stock Alert */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              Low Stock Alert
            </h3>
          </div>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-200">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map((product, index) => (
                  <div key={product.id || product._id || index} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-600">
                          Stock: {product.stock?.quantity || product.stock || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center text-green-600">
                  <Package className="h-8 w-8 mx-auto mb-2" />
                  <p>All products are well stocked</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debug Info - Remove this later */}
      <div className="bg-gray-100 p-4 rounded text-xs text-gray-600">
        <strong>Debug:</strong> User Role: {userRole}, User: {user?.name}
      </div>
    </div>
  );
};