// src/components/transactions/TransactionAnalytics.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, Select, Button } from '../ui';
import { formatCurrency } from '../../utils';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  RotateCcw,
  AlertCircle,
  Calendar,
  Download
} from 'lucide-react';

export const TransactionAnalytics = ({ 
  onPeriodChange,
  analytics,
  loading = false 
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const periodOptions = [
    { value: 'day', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
  ];

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    onPeriodChange(period);
  };

  // Mock data structure based on API documentation
  const defaultAnalytics = {
    totalTransactions: 0,
    totalRevenue: 0,
    averageTransactionValue: 0,
    successRate: 0,
    refundRate: 0,
    paymentMethods: {},
    statusBreakdown: {},
    recentTrends: {
      revenue: { change: 0, trend: 'up' },
      transactions: { change: 0, trend: 'up' },
      averageValue: { change: 0, trend: 'up' }
    }
  };

  const data = analytics || defaultAnalytics;

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(data.totalRevenue),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: data.recentTrends?.revenue?.change || 0,
      trend: data.recentTrends?.revenue?.trend || 'up'
    },
    {
      title: 'Total Transactions',
      value: data.totalTransactions?.toLocaleString() || '0',
      icon: CreditCard,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: data.recentTrends?.transactions?.change || 0,
      trend: data.recentTrends?.transactions?.trend || 'up'
    },
    {
      title: 'Average Transaction',
      value: formatCurrency(data.averageTransactionValue),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: data.recentTrends?.averageValue?.change || 0,
      trend: data.recentTrends?.averageValue?.trend || 'up'
    },
    {
      title: 'Success Rate',
      value: `${(data.successRate || 0).toFixed(1)}%`,
      icon: data.successRate >= 95 ? TrendingUp : AlertCircle,
      color: data.successRate >= 95 ? 'text-green-600' : 'text-yellow-600',
      bgColor: data.successRate >= 95 ? 'bg-green-100' : 'bg-yellow-100',
      change: 0,
      trend: 'neutral'
    }
  ];

  const getTrendIcon = (trend, change) => {
    if (change === 0) return null;
    return trend === 'up' ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const getTrendColor = (trend, change) => {
    if (change === 0) return 'text-gray-500';
    return trend === 'up' ? 'text-green-500' : 'text-red-500';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Transaction Analytics</h3>
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <Card>
                <CardContent className="p-6">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Transaction Analytics</h3>
        <div className="flex items-center space-x-3">
          <Select
            value={selectedPeriod}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="w-32"
          >
            {periodOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{stat.value}</p>
                  {stat.change !== 0 && (
                    <div className={`flex items-center mt-2 ${getTrendColor(stat.trend, stat.change)}`}>
                      {getTrendIcon(stat.trend, stat.change)}
                      <span className="text-sm ml-1">
                        {stat.change > 0 ? '+' : ''}{stat.change.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                <div className={`p-3 rounded-md ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods Breakdown */}
        <Card>
          <CardContent className="p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h4>
            <div className="space-y-3">
              {Object.entries(data.paymentMethods || {}).map(([method, count]) => {
                const percentage = data.totalTransactions > 0 
                  ? ((count / data.totalTransactions) * 100).toFixed(1)
                  : 0;
                
                const methodNames = {
                  'paynow': 'Paynow Mobile',
                  'card': 'Credit/Debit Card',
                  'bank_transfer': 'Bank Transfer',
                  'cash_on_delivery': 'Cash on Delivery'
                };

                return (
                  <div key={method} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-sm text-gray-700">
                        {methodNames[method] || method}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                      <span className="text-xs text-gray-500 ml-2">({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
              {Object.keys(data.paymentMethods || {}).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No payment method data available for this period
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transaction Status Breakdown */}
        <Card>
          <CardContent className="p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Transaction Status</h4>
            <div className="space-y-3">
              {Object.entries(data.statusBreakdown || {}).map(([status, count]) => {
                const percentage = data.totalTransactions > 0 
                  ? ((count / data.totalTransactions) * 100).toFixed(1)
                  : 0;
                
                const statusColors = {
                  'completed': 'bg-green-500',
                  'pending': 'bg-yellow-500',
                  'processing': 'bg-blue-500',
                  'failed': 'bg-red-500',
                  'cancelled': 'bg-gray-500',
                  'refunded': 'bg-orange-500'
                };

                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${statusColors[status] || 'bg-gray-400'}`}></div>
                      <span className="text-sm text-gray-700 capitalize">{status}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                      <span className="text-xs text-gray-500 ml-2">({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
              {Object.keys(data.statusBreakdown || {}).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No status data available for this period
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Refund Rate */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Refund Rate</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {(data.refundRate || 0).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(data.totalTransactions * (data.refundRate || 0) / 100).toFixed(0)} refunds
                </p>
              </div>
              <div className="p-3 rounded-md bg-orange-100">
                <RotateCcw className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Failed Transactions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed Rate</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {((100 - (data.successRate || 0)) || 0).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Monitor for payment issues
                </p>
              </div>
              <div className="p-3 rounded-md bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Processing Time */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Processing Time</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {data.averageProcessingTime || '2.3'}min
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  From creation to completion
                </p>
              </div>
              <div className="p-3 rounded-md bg-indigo-100">
                <Calendar className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Summary */}
      <Card>
        <CardContent className="p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            {periodOptions.find(p => p.value === selectedPeriod)?.label} Summary
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Processed</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(data.totalRevenue)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Transactions</p>
              <p className="text-lg font-semibold text-gray-900">
                {(data.totalTransactions || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-lg font-semibold text-green-600">
                {(data.successRate || 0).toFixed(1)}%
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Avg. Value</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(data.averageTransactionValue)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};