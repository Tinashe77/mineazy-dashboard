// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/layout';
import { Card, CardContent, Badge, LoadingSpinner } from '../components/ui';
import { formatCurrency, formatDate } from '../utils';
import api from '../services/api';
import {
  Package,
  ShoppingCart,
  Building2,
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle,
  Clock
} from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalProducts: 0,
      totalOrders: 0,
      totalBranches: 0,
      totalRevenue: 0,
    },
    recentOrders: [],
    lowStockProducts: [],
    loading: true,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true }));
      
      const [productsRes, ordersRes, branchesRes] = await Promise.all([
        api.getProducts({ limit: 100 }),
        api.getOrders({ limit: 20 }),
        api.getBranches(),
      ]);

      const products = productsRes.data || [];
      const orders = ordersRes.data || [];
      const branches = branchesRes.data || [];

      const totalRevenue = orders.reduce((sum, order) => 
        sum + (order.total || order.totalAmount || 0), 0
      );

      const lowStockProducts = products.filter(product => 
        (product.stock?.quantity || product.stock || 0) < 5
      );

      setDashboardData({
        stats: {
          totalProducts: products.length,
          totalOrders: orders.length,
          totalBranches: branches.length,
          totalRevenue,
        },
        recentOrders: orders.slice(0, 5),
        lowStockProducts: lowStockProducts.slice(0, 5),
        loading: false,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setDashboardData(prev => ({ ...prev, loading: false }));
    }
  };

  const { stats, recentOrders, lowStockProducts, loading } = dashboardData;

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Active Branches',
      value: stats.totalBranches,
      icon: Building2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.name}!`}
        subtitle="Here's what's happening with your mining equipment business today."
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
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
        {/* Recent Orders */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recent Orders
            </h3>
          </div>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-200">
              {recentOrders.map((order) => (
                <div key={order.id || order._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {order.id || order._id}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.customer || order.user?.name || order.user?.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.total || order.totalAmount, order.currency)}
                      </p>
                      <Badge variant={order.status === 'completed' ? 'success' : 'warning'}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {recentOrders.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-500">
                No recent orders found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              Low Stock Alert
            </h3>
          </div>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-200">
              {lowStockProducts.map((product) => (
                <div key={product.id || product._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500">{product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600">
                        Stock: {product.stock?.quantity || product.stock}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {lowStockProducts.length === 0 && (
              <div className="px-6 py-8 text-center text-green-600">
                All products are well stocked
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};