// src/pages/AuditPage.jsx - Complete implementation
import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../components/layout';
import { 
  Button, 
  Input, 
  Select, 
  Badge, 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell,
  Alert,
  Card,
  CardContent,
  Modal
} from '../components/ui';
import { formatDate, formatDateTime, getStatusVariant } from '../utils';
import { 
  Shield, 
  Eye, 
  Search, 
  Download, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  Clock,
  Activity,
  Lock,
  Unlock,
  FileText,
  Database,
  Settings,
  LogIn,
  LogOut,
  Edit,
  Trash2,
  Plus,
  Filter
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const AuditPage = () => {
  const { userRole } = useAuth();
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    resource: '',
    userId: '',
    severity: '',
    dateFrom: '',
    dateTo: '',
    ipAddress: ''
  });
  
  // Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  
  // Stats
  const [stats, setStats] = useState({
    totalLogs: 0,
    todayLogs: 0,
    criticalEvents: 0,
    failedLogins: 0,
    uniqueUsers: 0,
    uniqueIPs: 0
  });
  
  const [filterTimeout, setFilterTimeout] = useState(null);

  // Generate mock audit logs
  const generateMockAuditLogs = () => {
    const actions = [
      'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'DOWNLOAD', 
      'UPLOAD', 'EXPORT', 'IMPORT', 'PAYMENT_PROCESS', 'ORDER_CREATE',
      'USER_CREATE', 'USER_UPDATE', 'PRODUCT_CREATE', 'PRODUCT_UPDATE',
      'SETTINGS_UPDATE', 'PASSWORD_CHANGE', 'FAILED_LOGIN', 'SESSION_TIMEOUT'
    ];
    
    const resources = [
      'User', 'Product', 'Order', 'Transaction', 'Branch', 'Category',
      'Invoice', 'Report', 'Settings', 'AuditLog', 'Session', 'Database'
    ];
    
    const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    
    const users = [
      { id: 'user1', name: 'Admin User', email: 'admin@mining.com' },
      { id: 'user2', name: 'John Manager', email: 'john@mining.com' },
      { id: 'user3', name: 'Jane Smith', email: 'jane@mining.com' },
      { id: 'user4', name: 'Bob Wilson', email: 'bob@mining.com' },
      { id: 'user5', name: 'Alice Brown', email: 'alice@mining.com' }
    ];
    
    const ipAddresses = [
      '192.168.1.100', '10.0.0.50', '203.45.67.89', '172.16.0.25', 
      '185.123.45.67', '91.234.56.78', '8.8.8.8', '1.1.1.1'
    ];
    
    const mockLogs = [];
    
    for (let i = 1; i <= 200; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const resource = resources[Math.floor(Math.random() * resources.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const ipAddress = ipAddresses[Math.floor(Math.random() * ipAddresses.length)];
      
      const createdDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      
      // Generate realistic details based on action
      let details = {};
      let message = '';
      
      switch (action) {
        case 'LOGIN':
          message = `User ${user.name} logged in successfully`;
          details = {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            sessionId: `sess_${Math.random().toString(36).substr(2, 9)}`,
            loginMethod: 'email_password'
          };
          break;
        case 'FAILED_LOGIN':
          message = `Failed login attempt for ${user.email}`;
          details = {
            reason: 'Invalid password',
            attempts: Math.floor(Math.random() * 5) + 1,
            blocked: Math.random() > 0.7
          };
          break;
        case 'CREATE':
          message = `Created new ${resource.toLowerCase()}`;
          details = {
            resourceId: `${resource.toLowerCase()}_${Math.random().toString(36).substr(2, 9)}`,
            changes: { status: 'active', name: `New ${resource}` }
          };
          break;
        case 'UPDATE':
          message = `Updated ${resource.toLowerCase()}`;
          details = {
            resourceId: `${resource.toLowerCase()}_${Math.random().toString(36).substr(2, 9)}`,
            changes: { 
              before: { status: 'inactive' }, 
              after: { status: 'active' } 
            }
          };
          break;
        case 'DELETE':
          message = `Deleted ${resource.toLowerCase()}`;
          details = {
            resourceId: `${resource.toLowerCase()}_${Math.random().toString(36).substr(2, 9)}`,
            permanent: Math.random() > 0.5
          };
          break;
        case 'EXPORT':
          message = `Exported ${resource.toLowerCase()} data`;
          details = {
            format: 'CSV',
            recordCount: Math.floor(Math.random() * 1000) + 1,
            fileSize: `${Math.floor(Math.random() * 10) + 1}MB`
          };
          break;
        default:
          message = `Performed ${action.toLowerCase()} on ${resource.toLowerCase()}`;
          details = { action: action.toLowerCase(), resource: resource.toLowerCase() };
      }
      
      mockLogs.push({
        id: `audit_${i.toString().padStart(6, '0')}`,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action,
        resource,
        resourceId: `${resource.toLowerCase()}_${Math.random().toString(36).substr(2, 9)}`,
        message,
        details,
        severity,
        ipAddress,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        endpoint: `/${resource.toLowerCase()}s${action === 'CREATE' ? '' : '/123'}`,
        method: action === 'CREATE' ? 'POST' : action === 'UPDATE' ? 'PUT' : action === 'DELETE' ? 'DELETE' : 'GET',
        statusCode: action === 'FAILED_LOGIN' ? 401 : Math.random() > 0.95 ? 500 : 200,
        duration: Math.floor(Math.random() * 2000) + 50, // milliseconds
        createdAt: createdDate.toISOString(),
        success: action !== 'FAILED_LOGIN' && Math.random() > 0.05
      });
    }
    
    return mockLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  // Load audit logs
  const loadAuditLogs = useCallback(async (newFilters = null, page = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentFilters = newFilters || filters;
      const currentPage = page || pagination.currentPage;
      
      // In real implementation, you would use:
      // const response = await api.getAuditLogs(params);
      const mockLogs = generateMockAuditLogs();
      
      // Apply filters
      let filteredLogs = mockLogs;
      
      if (currentFilters.search) {
        const search = currentFilters.search.toLowerCase();
        filteredLogs = filteredLogs.filter(log => 
          log.message.toLowerCase().includes(search) ||
          log.userName.toLowerCase().includes(search) ||
          log.userEmail.toLowerCase().includes(search) ||
          log.resource.toLowerCase().includes(search) ||
          log.ipAddress.includes(search)
        );
      }
      
      if (currentFilters.action) {
        filteredLogs = filteredLogs.filter(log => log.action === currentFilters.action);
      }
      
      if (currentFilters.resource) {
        filteredLogs = filteredLogs.filter(log => log.resource === currentFilters.resource);
      }
      
      if (currentFilters.severity) {
        filteredLogs = filteredLogs.filter(log => log.severity === currentFilters.severity);
      }
      
      if (currentFilters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === currentFilters.userId);
      }
      
      if (currentFilters.ipAddress) {
        filteredLogs = filteredLogs.filter(log => 
          log.ipAddress.includes(currentFilters.ipAddress)
        );
      }
      
      if (currentFilters.dateFrom) {
        const fromDate = new Date(currentFilters.dateFrom);
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.createdAt) >= fromDate
        );
      }
      
      if (currentFilters.dateTo) {
        const toDate = new Date(currentFilters.dateTo + 'T23:59:59');
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.createdAt) <= toDate
        );
      }
      
      // Pagination
      const itemsPerPage = 25;
      const totalItems = filteredLogs.length;
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);
      
      setAuditLogs(paginatedLogs);
      setPagination({
        currentPage,
        totalPages,
        totalItems
      });
      
      // Calculate stats
      calculateStats(mockLogs);
      
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      setError('Failed to load audit logs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage]);

  const calculateStats = (allLogs) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayLogs = allLogs.filter(log => 
      new Date(log.createdAt) >= today
    ).length;
    
    const criticalEvents = allLogs.filter(log => 
      log.severity === 'CRITICAL' || log.severity === 'HIGH'
    ).length;
    
    const failedLogins = allLogs.filter(log => 
      log.action === 'FAILED_LOGIN'
    ).length;
    
    const uniqueUsers = new Set(allLogs.map(log => log.userId)).size;
    const uniqueIPs = new Set(allLogs.map(log => log.ipAddress)).size;
    
    setStats({
      totalLogs: allLogs.length,
      todayLogs,
      criticalEvents,
      failedLogins,
      uniqueUsers,
      uniqueIPs
    });
  };

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
    
    if (filterTimeout) clearTimeout(filterTimeout);
    
    const timeout = setTimeout(() => {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
      loadAuditLogs(newFilters, 1);
    }, 500);
    
    setFilterTimeout(timeout);
  }, [filterTimeout, loadAuditLogs]);

  const handleClearFilters = useCallback(() => {
    const clearedFilters = {
      search: '',
      action: '',
      resource: '',
      userId: '',
      severity: '',
      dateFrom: '',
      dateTo: '',
      ipAddress: ''
    };
    setFilters(clearedFilters);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    loadAuditLogs(clearedFilters, 1);
  }, [loadAuditLogs]);

  // Export logs
  const exportLogs = useCallback(async () => {
    try {
      setSuccess('Exporting audit logs...');
      
      // Generate CSV content
      const csvHeaders = [
        'Timestamp', 'User', 'Action', 'Resource', 'Message', 'IP Address', 
        'Severity', 'Status', 'Duration (ms)'
      ];
      
      let csvContent = csvHeaders.join(',') + '\n';
      
      auditLogs.forEach(log => {
        const row = [
          formatDateTime(log.createdAt),
          `"${log.userName}"`,
          log.action,
          log.resource,
          `"${log.message}"`,
          log.ipAddress,
          log.severity,
          log.success ? 'Success' : 'Failed',
          log.duration
        ];
        csvContent += row.join(',') + '\n';
      });
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      setSuccess('Audit logs exported successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export audit logs.');
    }
  }, [auditLogs]);

  // View log details
  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  // Action icons
  const getActionIcon = (action) => {
    switch (action) {
      case 'LOGIN': return <LogIn className="h-4 w-4 text-green-600" />;
      case 'LOGOUT': return <LogOut className="h-4 w-4 text-gray-600" />;
      case 'FAILED_LOGIN': return <Lock className="h-4 w-4 text-red-600" />;
      case 'CREATE': return <Plus className="h-4 w-4 text-blue-600" />;
      case 'UPDATE': return <Edit className="h-4 w-4 text-yellow-600" />;
      case 'DELETE': return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'VIEW': return <Eye className="h-4 w-4 text-gray-600" />;
      case 'DOWNLOAD': return <Download className="h-4 w-4 text-purple-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  // Severity variants
  const getSeverityVariant = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'default';
      default: return 'default';
    }
  };

  const actionOptions = [
    'LOGIN', 'LOGOUT', 'FAILED_LOGIN', 'CREATE', 'UPDATE', 'DELETE', 
    'VIEW', 'DOWNLOAD', 'UPLOAD', 'EXPORT', 'IMPORT'
  ];

  const resourceOptions = [
    'User', 'Product', 'Order', 'Transaction', 'Branch', 'Category',
    'Invoice', 'Report', 'Settings', 'AuditLog', 'Session'
  ];

  const severityOptions = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs & Security"
        subtitle="Monitor system activity and security events"
      >
        <div className="flex space-x-2">
          <Button onClick={exportLogs} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
          <Button
            variant="outline"
            onClick={() => loadAuditLogs()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </PageHeader>

      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="h-6 w-6 mx-auto mb-1 text-blue-600" />
            <p className="text-lg font-bold text-gray-900">{stats.totalLogs}</p>
            <p className="text-xs text-gray-600">Total Events</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-1 text-green-600" />
            <p className="text-lg font-bold text-gray-900">{stats.todayLogs}</p>
            <p className="text-xs text-gray-600">Today's Events</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-6 w-6 mx-auto mb-1 text-red-600" />
            <p className="text-lg font-bold text-gray-900">{stats.criticalEvents}</p>
            <p className="text-xs text-gray-600">Critical Events</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Lock className="h-6 w-6 mx-auto mb-1 text-orange-600" />
            <p className="text-lg font-bold text-gray-900">{stats.failedLogins}</p>
            <p className="text-xs text-gray-600">Failed Logins</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <User className="h-6 w-6 mx-auto mb-1 text-purple-600" />
            <p className="text-lg font-bold text-gray-900">{stats.uniqueUsers}</p>
            <p className="text-xs text-gray-600">Active Users</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="h-6 w-6 mx-auto mb-1 text-indigo-600" />
            <p className="text-lg font-bold text-gray-900">{stats.uniqueIPs}</p>
            <p className="text-xs text-gray-600">Unique IPs</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e) => handleFiltersChange({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.action}
              onChange={(e) => handleFiltersChange({ ...filters, action: e.target.value })}
            >
              <option value="">All Actions</option>
              {actionOptions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </Select>

            <Select
              value={filters.resource}
              onChange={(e) => handleFiltersChange({ ...filters, resource: e.target.value })}
            >
              <option value="">All Resources</option>
              {resourceOptions.map(resource => (
                <option key={resource} value={resource}>{resource}</option>
              ))}
            </Select>

            <Select
              value={filters.severity}
              onChange={(e) => handleFiltersChange({ ...filters, severity: e.target.value })}
            >
              <option value="">All Severities</option>
              {severityOptions.map(severity => (
                <option key={severity} value={severity}>{severity}</option>
              ))}
            </Select>

            <Input
              placeholder="IP Address"
              value={filters.ipAddress}
              onChange={(e) => handleFiltersChange({ ...filters, ipAddress: e.target.value })}
            />

            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFiltersChange({ ...filters, dateFrom: e.target.value })}
              placeholder="From Date"
            />

            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFiltersChange({ ...filters, dateTo: e.target.value })}
              placeholder="To Date"
            />

            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="w-full"
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading audit logs...</p>
                  </TableCell>
                </TableRow>
              ) : auditLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <Shield className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No audit logs</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No audit logs found matching your criteria.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                auditLogs.map((log) => (
                  <TableRow key={log.id} className={!log.success ? 'bg-red-50' : ''}>
                    <TableCell>
                      <div className="text-sm text-gray-900">
                        {formatDateTime(log.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {log.userName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {log.userEmail}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {getActionIcon(log.action)}
                        <span className="ml-2 text-sm text-gray-900">
                          {log.action}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="info">
                        {log.resource}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-sm text-gray-900 truncate" title={log.message}>
                          {log.message}
                        </p>
                        {log.endpoint && (
                          <p className="text-xs text-gray-500">
                            {log.method} {log.endpoint}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono text-gray-900">
                        {log.ipAddress}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSeverityVariant(log.severity)}>
                        {log.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {log.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 mr-1" />
                        )}
                        <span className={`text-sm ${log.success ? 'text-green-600' : 'text-red-600'}`}>
                          {log.statusCode}
                        </span>
                        {log.duration && (
                          <span className="text-xs text-gray-500 ml-1">
                            ({log.duration}ms)
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(log)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4">
          <Button
            variant="outline"
            disabled={pagination.currentPage === 1}
            onClick={() => {
              setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }));
              loadAuditLogs(null, pagination.currentPage - 1);
            }}
          >
            Previous
          </Button>
          
          <span className="text-sm text-gray-700">
            Page {pagination.currentPage} of {pagination.totalPages} 
            ({pagination.totalItems} total logs)
          </span>
          
          <Button
            variant="outline"
            disabled={pagination.currentPage === pagination.totalPages}
            onClick={() => {
              setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
              loadAuditLogs(null, pagination.currentPage + 1);
            }}
          >
            Next
          </Button>
        </div>
      )}

      {/* Log Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedLog(null);
        }}
        title="Audit Log Details"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-6">
            {/* Header */}
            <div className="border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    {getActionIcon(selectedLog.action)}
                    <span className="ml-2">{selectedLog.action} - {selectedLog.resource}</span>
                  </h3>
                  <p className="text-sm text-gray-500">ID: {selectedLog.id}</p>
                </div>
                <div className="flex space-x-2">
                  <Badge variant={getSeverityVariant(selectedLog.severity)}>
                    {selectedLog.severity}
                  </Badge>
                  <Badge variant={selectedLog.success ? 'success' : 'error'}>
                    {selectedLog.success ? 'Success' : 'Failed'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Event Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Timestamp:</span>
                    <span className="font-medium">{formatDateTime(selectedLog.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Action:</span>
                    <span className="font-medium">{selectedLog.action}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Resource:</span>
                    <span className="font-medium">{selectedLog.resource}</span>
                  </div>
                  {selectedLog.resourceId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Resource ID:</span>
                      <span className="font-mono text-xs">{selectedLog.resourceId}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status Code:</span>
                    <span className="font-medium">{selectedLog.statusCode}</span>
                  </div>
                  {selectedLog.duration && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{selectedLog.duration}ms</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">User & Session</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">User:</span>
                    <span className="font-medium">{selectedLog.userName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{selectedLog.userEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">IP Address:</span>
                    <span className="font-mono">{selectedLog.ipAddress}</span>
                  </div>
                  {selectedLog.endpoint && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Endpoint:</span>
                      <span className="font-mono text-xs">{selectedLog.method} {selectedLog.endpoint}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Message */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Message</h4>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700">{selectedLog.message}</p>
              </div>
            </div>

            {/* Details */}
            {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Additional Details</h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* User Agent */}
            {selectedLog.userAgent && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">User Agent</h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 break-all">{selectedLog.userAgent}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedLog(null);
                }}
              >
                Close
              </Button>
              {selectedLog.severity === 'CRITICAL' && (
                <Button variant="outline">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Flag for Review
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Security Alerts */}
      {stats.failedLogins > 10 && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <span className="font-medium">Security Alert: </span>
          High number of failed login attempts detected ({stats.failedLogins}). 
          Consider reviewing security policies.
        </Alert>
      )}

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium text-gray-900 mb-2">Debug Information</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p>Showing {auditLogs.length} of {pagination.totalItems} logs</p>
              <p>Active Filters: {Object.values(filters).filter(Boolean).length}</p>
              <p>User Role: {userRole}</p>
              <p>Page: {pagination.currentPage} of {pagination.totalPages}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};