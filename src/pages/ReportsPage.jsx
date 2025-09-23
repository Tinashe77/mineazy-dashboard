import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout';
import { Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, Alert, Input, Select } from '../components/ui';
import { formatDate, getStatusVariant } from '../utils';
import { Plus, FileText, Download, Trash2, Eye } from 'lucide-react';
import api from '../services/api';
import { GenerateReportModal } from '../components/reports/GenerateReportModal';

const reportTypes = [
  { value: 'sales', label: 'Sales' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'customer', label: 'Customer' },
  { value: 'branch', label: 'Branch' },
  { value: 'financial', label: 'Financial' },
  { value: 'audit', label: 'Audit' },
];

const statusOptions = [
  { value: 'completed', label: 'Completed' },
  { value: 'generating', label: 'Generating' },
  { value: 'failed', label: 'Failed' },
];

export const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [filters, setFilters] = useState({
    reportType: '',
    status: '',
    startDate: '',
    endDate: '',
  });
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const navigate = useNavigate();

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { ...filters, page: pagination.page, limit: pagination.limit };
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await api.getReports(params);
      setReports(response.data || []);
      setPagination(response.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleDeleteReport = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      try {
        await api.deleteReport(reportId);
        fetchReports();
      } catch (err) {
        setError(err.message || 'Failed to delete report.');
      }
    }
  };

  const handleExportReport = async (reportId) => {
    try {
        await api.exportReportAsCsv(reportId);
    } catch (err) {
        setError(err.message || 'Failed to export report.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Generate, view, and manage business reports"
      >
        <Button onClick={() => setShowGenerateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </PageHeader>

      {error && <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-white rounded-lg shadow">
        <Select name="reportType" value={filters.reportType} onChange={handleFilterChange}>
          <option value="">All Types</option>
          {reportTypes.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </Select>
        <Select name="status" value={filters.status} onChange={handleFilterChange}>
          <option value="">All Statuses</option>
          {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </Select>
        <Input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
        <Input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Generated On</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div></TableCell></TableRow>
            ) : reports.length > 0 ? reports.map((report) => (
              <TableRow key={report._id}>
                <TableCell className="font-medium">{report.title}</TableCell>
                <TableCell><Badge variant="outline">{report.reportType}</Badge></TableCell>
                <TableCell><Badge variant={getStatusVariant(report.status)}>{report.status}</Badge></TableCell>
                <TableCell>{formatDate(report.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm" title="View Details" onClick={() => navigate(`/reports/${report._id}`)}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" title="Export CSV" onClick={() => handleExportReport(report._id)}><Download className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" title="Delete Report" onClick={() => handleDeleteReport(report._id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={5} className="text-center py-12"><FileText className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3><p className="mt-1 text-sm text-gray-500">Get started by generating a new report.</p></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-700">
          Page {pagination.page} of {pagination.pages}, Total {pagination.total} reports
        </span>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page <= 1}>Previous</Button>
          <Button variant="outline" onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page >= pagination.pages}>Next</Button>
        </div>
      </div>

      <GenerateReportModal isOpen={showGenerateModal} onClose={() => setShowGenerateModal(false)} onReportGenerated={fetchReports} />
    </div>
  );
};