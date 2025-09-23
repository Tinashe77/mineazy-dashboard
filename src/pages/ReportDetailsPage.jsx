import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout';
import { Button, Card, Alert, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from '../components/ui';
import { Download, Trash2, ArrowLeft, BarChart2, Hash, Info } from 'lucide-react';
import api from '../services/api';
import { formatDate, getStatusVariant } from '../utils';

const DetailsTable = ({ data, title }) => {
  if (!data || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && Object.keys(data).length === 0)) {
    return <p>No detailed data available for this section.</p>;
  }

  const dataAsArray = Array.isArray(data) ? data : [data];
  if (dataAsArray.length === 0) {
    return <p>No detailed data available for this section.</p>;
  }

  const headers = Object.keys(dataAsArray[0]);
  return (
    <div>
      <h4 className="text-lg font-semibold mb-2">{title}</h4>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map(header => <TableHead key={header}>{header}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataAsArray.map((row, index) => (
              <TableRow key={index}>
                {headers.map(header => (
                  <TableCell key={header}>
                    {typeof row[header] === 'object' ? JSON.stringify(row[header]) : String(row[header])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export const ReportDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.getReportById(id);
        setReport(response.data);
      } catch (err) {
        setError(err.message || 'Failed to load report details.');
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchReport();
    }
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        await api.deleteReport(id);
        navigate('/reports');
      } catch (err) {
        setError(err.message || 'Failed to delete report.');
      }
    }
  };

  const handleExport = async () => {
    try {
      await api.exportReportAsCsv(id);
    } catch (err) {
      setError(err.message || 'Failed to export report.');
    }
  };

  if (loading) {
    return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div></div>;
  }

  if (error) {
    return <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>;
  }

  if (!report) {
    return <p>No report found.</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={report.title}
        subtitle={`Details for ${report.reportType} report generated on ${formatDate(report.createdAt)}`}
        onBack={() => navigate('/reports')}
      >
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
          <Button variant="destructive" onClick={handleDelete}><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center"><BarChart2 className="h-6 w-6 mr-3 text-primary-600" />Report Summary</h3>
              <DetailsTable data={report.data.summary} title="Summary" />
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center"><Hash className="h-6 w-6 mr-3 text-primary-600" />Metrics</h3>
              <DetailsTable data={report.data.metrics} title="Key Metrics" />
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center"><Info className="h-6 w-6 mr-3 text-primary-600" />Report Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Report ID:</span><span className="font-mono">{report._id}</span></div>
                <div className="flex justify-between"><span>Status:</span><Badge variant={getStatusVariant(report.status)}>{report.status}</Badge></div>
                <div className="flex justify-between"><span>Format:</span><Badge variant="outline">{report.format}</Badge></div>
                <div className="flex justify-between"><span>Start Date:</span><span>{formatDate(report.scope.startDate)}</span></div>
                <div className="flex justify-between"><span>End Date:</span><span>{formatDate(report.scope.endDate)}</span></div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <div className="p-6">
          <DetailsTable data={report.data.details} title="Detailed Data" />
        </div>
      </Card>
    </div>
  );
};
