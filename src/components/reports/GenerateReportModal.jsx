import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Select, Alert } from '../ui';
import api from '../../services/api';

const reportTypes = [
  { value: 'sales', label: 'Sales' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'customer', label: 'Customer' },
  { value: 'branch', label: 'Branch' },
  { value: 'financial', label: 'Financial' },
  { value: 'audit', label: 'Audit' },
];

const formatOptions = [
  { value: 'json', label: 'JSON' },
  { value: 'csv', label: 'CSV' },
];

export const GenerateReportModal = ({ isOpen, onClose, onReportGenerated }) => {
  const [formData, setFormData] = useState({
    reportType: 'sales',
    title: '',
    startDate: '',
    endDate: '',
    format: 'json',
    branchId: '',
  });
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        reportType: 'sales',
        title: '',
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        format: 'json',
        branchId: '',
      });
      setError(null);

      const fetchBranches = async () => {
        try {
          const response = await api.getBranches();
          setBranches(response.data || []);
        } catch (err) {
          console.error("Failed to fetch branches for report modal:", err);
        }
      };
      fetchBranches();
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.title || !formData.reportType || !formData.startDate || !formData.endDate) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        reportType: formData.reportType,
        title: formData.title,
        scope: {
          startDate: formData.startDate,
          endDate: formData.endDate,
        },
        format: formData.format,
      };
      if (formData.branchId) {
        payload.scope.branchId = formData.branchId;
      }

      await api.generateReport(payload);
      onReportGenerated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate New Report">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>}

        <Input
          label="Report Title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          required
          placeholder="e.g., Q3 Sales Summary"
        />

        <Select
          label="Report Type"
          name="reportType"
          value={formData.reportType}
          onChange={handleInputChange}
          required
        >
          {reportTypes.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </Select>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleInputChange}
            required
          />
          <Input
            label="End Date"
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleInputChange}
            required
          />
        </div>

        <Select
          label="Branch (Optional)"
          name="branchId"
          value={formData.branchId}
          onChange={handleInputChange}
        >
          <option value="">All Branches</option>
          {branches.map(branch => <option key={branch._id} value={branch._id}>{branch.name}</option>)}
        </Select>

        <Select
          label="Format"
          name="format"
          value={formData.format}
          onChange={handleInputChange}
          required
        >
          {formatOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </Select>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {loading ? 'Generating...' : 'Generate'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
