// src/pages/BranchesPage.jsx - Full implementation with API integration
import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout';
import { 
  Button, 
  Badge, 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell, 
  Modal, 
  Input, 
  Select, 
  Textarea,
  Alert,
  Card,
  CardContent 
} from '../components/ui';
import { formatDate, getStatusVariant, formatCurrency } from '../utils';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Building2, 
  MapPin, 
  Phone, 
  Mail,
  DollarSign,
  Users,
  UserCheck,
  UserX
} from 'lucide-react';
import api, { APIError } from '../services/api';
import { Package } from 'lucide-react';

export const BranchesPage = () => {
  const [branches, setBranches] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBranchForManager, setSelectedBranchForManager] = useState(null);
  const [availableManagers, setAvailableManagers] = useState([]);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location: {
      address: '',
      city: '',
      province: '',
      country: 'Zimbabwe'
    },
    contact: {
      phone: '',
      email: ''
    },
    currencies: {
      USD: {
        rate: 1,
        symbol: '$'
      },
      ZWG: {
        rate: 50,
        symbol: 'ZWG'
      }
    },
    status: 'active'
  });

  // Stats data
  const [stats, setStats] = useState({
    totalBranches: 0,
    activeBranches: 0,
    totalProducts: 0,
    totalOrders: 0
  });

  useEffect(() => {
    loadBranches();
    loadBranchStats();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.getBranches();
      setBranches(response.data || []);
      
    } catch (error) {
      console.error('Failed to load branches:', error);
      if (error instanceof APIError) {
        setError(error.message);
      } else {
        setError('Failed to load branches. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadBranchStats = async () => {
    try {
      // This would be a real API call in production
      // For now, we'll calculate from the branches data
      const branchesResponse = await api.getBranches();
      const branchesData = branchesResponse.data || [];
      
      setStats({
        totalBranches: branchesData.length,
        activeBranches: branchesData.filter(b => b.status === 'active').length,
        totalProducts: 0, // Would come from API
        totalOrders: 0 // Would come from API
      });
    } catch (error) {
      console.error('Failed to load branch stats:', error);
    }
  };

  const handleSaveBranch = async () => {
    try {
      setError(null);
      
      // Validation
      if (!formData.name.trim()) {
        setError('Branch name is required');
        return;
      }
      if (!formData.code.trim()) {
        setError('Branch code is required');
        return;
      }
      if (!formData.location.address.trim()) {
        setError('Address is required');
        return;
      }
      if (!formData.location.city.trim()) {
        setError('City is required');
        return;
      }
      if (!formData.contact.phone.trim()) {
        setError('Phone number is required');
        return;
      }

      if (selectedBranch) {
        await api.updateBranch(selectedBranch._id || selectedBranch.id, formData);
      } else {
        await api.createBranch(formData);
      }
      
      await loadBranches();
      await loadBranchStats();
      setShowBranchForm(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save branch:', error);
      if (error instanceof APIError) {
        setError(error.message);
      } else {
        setError('Failed to save branch. Please try again.');
      }
    }
  };

  const handleDeleteBranch = async (branchId) => {
    if (!confirm('Are you sure you want to delete this branch? This action cannot be undone.')) {
      return;
    }

    try {
      await api.deleteBranch(branchId);
      await loadBranches();
      await loadBranchStats();
    } catch (error) {
      console.error('Failed to delete branch:', error);
      if (error instanceof APIError) {
        setError(error.message);
      } else {
        setError('Failed to delete branch. Please try again.');
      }
    }
  };

  const openBranchForm = (branch = null) => {
    setSelectedBranch(branch);
    if (branch) {
      setFormData({
        name: branch.name || '',
        code: branch.code || '',
        location: {
          address: branch.location?.address || '',
          city: branch.location?.city || '',
          province: branch.location?.province || '',
          country: branch.location?.country || 'Zimbabwe'
        },
        contact: {
          phone: branch.contact?.phone || '',
          email: branch.contact?.email || ''
        },
        currencies: branch.currencies || {
          USD: { rate: 1, symbol: '$' },
          ZWG: { rate: 50, symbol: 'ZWG' }
        },
        status: branch.status || 'active'
      });
    } else {
      resetForm();
    }
    setShowBranchForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      location: {
        address: '',
        city: '',
        province: '',
        country: 'Zimbabwe'
      },
      contact: {
        phone: '',
        email: ''
      },
      currencies: {
        USD: { rate: 1, symbol: '$' },
        ZWG: { rate: 50, symbol: 'ZWG' }
      },
      status: 'active'
    });
    setSelectedBranch(null);
    setError(null);
  };

  const updateFormData = (path, value) => {
    const pathArray = path.split('.');
    setFormData(prev => {
      const newData = { ...prev };
      let current = newData;
      
      for (let i = 0; i < pathArray.length - 1; i++) {
        current = current[pathArray[i]];
      }
      
      current[pathArray[pathArray.length - 1]] = value;
      return newData;
    });
  };

  const openAssignManagerModal = async (branch) => {
    setSelectedBranchForManager(branch);
    try {
      setLoading(true);
      const res = await api.getShopManagers();
      setAvailableManagers(res.managers || []);
      setShowAssignModal(true);
    } catch (err) {
      setError(err.message || 'Failed to load managers.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignManager = async () => {
    if (!selectedBranchForManager || !selectedManagerId) {
      setError('Please select a manager.');
      return;
    }
    try {
      await api.assignBranchManager(selectedBranchForManager._id, selectedManagerId);
      setShowAssignModal(false);
      setSelectedManagerId('');
      loadBranches();
    } catch (err) {
      setError(err.message || 'Failed to assign manager.');
    }
  };

  const handleRemoveManager = async (branchId) => {
    if (!window.confirm('Are you sure you want to remove the manager from this branch?')) return;
    try {
      await api.removeBranchManager(branchId);
      loadBranches();
    } catch (err) {
      setError(err.message || 'Failed to remove manager.');
    }
  };

  const zimbabweProvinces = [
    'Harare', 'Bulawayo', 'Manicaland', 'Mashonaland Central',
    'Mashonaland East', 'Mashonaland West', 'Masvingo',
    'Matabeleland North', 'Matabeleland South', 'Midlands'
  ];

  const statCards = [
    {
      title: 'Total Branches',
      value: stats.totalBranches,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Active Branches',
      value: stats.activeBranches,
      icon: MapPin,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Products Available',
      value: stats.totalProducts,
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: Users,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branches Management"
        subtitle="Manage your mining equipment distribution centers across Zimbabwe"
      >
        <Button onClick={() => openBranchForm()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Branch
        </Button>
      </PageHeader>

      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

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

      {/* Branches Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Branch</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading branches...</p>
                </TableCell>
              </TableRow>
            ) : branches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No branches</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating your first branch.
                  </p>
                </TableCell>
              </TableRow>
            ) : branches.map((branch) => (
              <TableRow key={branch._id || branch.id}>
                <TableCell>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {branch.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      Code: {branch.code}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-900">
                    <div>{branch.location?.city}, {branch.location?.province}</div>
                    <div className="text-gray-500">{branch.location?.address}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {branch.manager ? (
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{branch.manager.name}</div>
                      <div className="text-gray-500">{branch.manager.email}</div>
                    </div>
                  ) : (
                    <Badge variant="secondary">Unassigned</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-900">
                    <div className="flex items-center">
                      <Phone className="h-3 w-3 mr-1" />
                      {branch.contact?.phone}
                    </div>
                    {branch.contact?.email && (
                      <div className="flex items-center text-gray-500">
                        <Mail className="h-3 w-3 mr-1" />
                        {branch.contact?.email}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(branch.status)}>
                    {branch.status || 'active'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => openBranchForm(branch)} title="Edit Branch"><Edit className="h-4 w-4" /></Button>
                    {branch.manager ? (
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveManager(branch._id)} title="Remove Manager"><UserX className="h-4 w-4 text-red-500" /></Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => openAssignManagerModal(branch)} title="Assign Manager"><UserCheck className="h-4 w-4 text-green-600" /></Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteBranch(branch._id || branch.id)} title="Delete Branch"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Assign Manager Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={`Assign Manager to ${selectedBranchForManager?.name}`}
      >
        <div className="space-y-4">
          <Select
            label="Select a Shop Manager"
            value={selectedManagerId}
            onChange={(e) => setSelectedManagerId(e.target.value)}
          >
            <option value="">-- Select a Manager --</option>
            {availableManagers.map(manager => (
              <option key={manager._id} value={manager._id}>
                {manager.name} ({manager.email})
              </option>
            ))}
          </Select>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setShowAssignModal(false)}>Cancel</Button>
            <Button onClick={handleAssignManager}>Assign Manager</Button>
          </div>
        </div>
      </Modal>

      {/* Branch Form Modal */}
      <Modal
        isOpen={showBranchForm}
        onClose={() => {
          setShowBranchForm(false);
          resetForm();
        }}
        title={selectedBranch ? 'Edit Branch' : 'Add New Branch'}
        size="lg"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSaveBranch(); }} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Branch Name"
              required
              value={formData.name}
              onChange={(e) => updateFormData('name', e.target.value)}
              placeholder="e.g., Harare Main Branch"
            />
            <Input
              label="Branch Code"
              required
              value={formData.code}
              onChange={(e) => updateFormData('code', e.target.value.toUpperCase())}
              placeholder="e.g., HRE001"
            />
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Location Details</h4>
            
            <Textarea
              label="Address"
              required
              rows={2}
              value={formData.location.address}
              onChange={(e) => updateFormData('location.address', e.target.value)}
              placeholder="Street address"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="City"
                required
                value={formData.location.city}
                onChange={(e) => updateFormData('location.city', e.target.value)}
                placeholder="e.g., Harare"
              />
              
              <Select
                label="Province"
                required
                value={formData.location.province}
                onChange={(e) => updateFormData('location.province', e.target.value)}
              >
                <option value="">Select Province</option>
                {zimbabweProvinces.map(province => (
                  <option key={province} value={province}>{province}</option>
                ))}
              </Select>
            </div>
            
            <Input
              label="Country"
              value={formData.location.country}
              onChange={(e) => updateFormData('location.country', e.target.value)}
              placeholder="Zimbabwe"
              disabled
            />
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Contact Information</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                required
                type="tel"
                value={formData.contact.phone}
                onChange={(e) => updateFormData('contact.phone', e.target.value)}
                placeholder="+263771234567"
              />
              
              <Input
                label="Email Address"
                type="email"
                value={formData.contact.email}
                onChange={(e) => updateFormData('contact.email', e.target.value)}
                placeholder="branch@mining.com"
              />
            </div>
          </div>

          {/* Currency Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Currency Settings</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="USD Exchange Rate"
                type="number"
                step="0.01"
                value={formData.currencies.USD.rate}
                onChange={(e) => updateFormData('currencies.USD.rate', parseFloat(e.target.value))}
                disabled
              />
              
              <Input
                label="ZWG Exchange Rate"
                type="number"
                step="0.01"
                value={formData.currencies.ZWG.rate}
                onChange={(e) => updateFormData('currencies.ZWG.rate', parseFloat(e.target.value))}
                placeholder="50.00"
              />
            </div>
          </div>

          {/* Status */}
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => updateFormData('status', e.target.value)}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Under Maintenance</option>
          </Select>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowBranchForm(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {selectedBranch ? 'Update Branch' : 'Create Branch'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};