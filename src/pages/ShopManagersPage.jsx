import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout';
import { Button, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Modal, Input, Select, Alert } from '../components/ui';
import { formatDate, getStatusVariant } from '../utils';
import { Plus, Edit, Trash2, User } from 'lucide-react';
import api from '../services/api';

export const ShopManagersPage = () => {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showManagerForm, setShowManagerForm] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    isActive: true,
  });

  useEffect(() => {
    loadManagers();
  }, []);

  const loadManagers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getShopManagers();
      setManagers(response.managers || []);
    } catch (err) {
      setError(err.message || 'Failed to load shop managers.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', phone: '', isActive: true });
    setSelectedManager(null);
  };

  const openManagerForm = (manager = null) => {
    setSelectedManager(manager);
    if (manager) {
      setFormData({
        name: manager.name || '',
        email: manager.email || '',
        password: '', // Password is not sent for updates
        phone: manager.phone || '',
        isActive: manager.isActive !== undefined ? manager.isActive : true,
      });
    } else {
      resetForm();
    }
    setShowManagerForm(true);
  };

  const handleSaveManager = async () => {
    try {
      let data = { ...formData };
      if (selectedManager) {
        // For updates, send only allowed fields and remove email/password
        const { email, password, ...updateData } = data;
        await api.updateShopManager(selectedManager._id, updateData);
      } else {
        await api.createShopManager(data);
      }
      await loadManagers();
      setShowManagerForm(false);
      resetForm();
    } catch (err) {
      setError('Failed to save manager: ' + (err.data?.message || err.message));
    }
  };

  const handleDeleteManager = async (managerId) => {
    if (!window.confirm('Are you sure you want to delete this shop manager?')) return;

    try {
      await api.deleteShopManager(managerId);
      await loadManagers();
    } catch (err) {
      setError('Failed to delete manager: ' + (err.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shop Managers"
        subtitle="Manage users with the shop manager role"
      >
        <Button onClick={() => openManagerForm()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Manager
        </Button>
      </PageHeader>

      {error && <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Manager</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div></TableCell></TableRow>
            ) : managers.map((manager) => (
              <TableRow key={manager._id}>
                <TableCell>
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0"><div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center"><User className="h-5 w-5 text-primary-600" /></div></div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{manager.name}</div>
                      <div className="text-sm text-gray-500">{manager.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{manager.phone || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(manager.isActive ? 'active' : 'inactive')}>
                    {manager.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(manager.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => openManagerForm(manager)} title="Edit Manager"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteManager(manager._id)} title="Delete Manager"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {managers.length === 0 && !loading && (
          <div className="text-center py-12"><User className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2 text-sm font-medium text-gray-900">No shop managers found</h3><p className="mt-1 text-sm text-gray-500">Get started by adding a new manager.</p></div>
        )}
      </div>

      <Modal
        isOpen={showManagerForm}
        onClose={() => setShowManagerForm(false)}
        title={selectedManager ? 'Edit Shop Manager' : 'Add New Shop Manager'}
      >
        <div className="space-y-4">
          <Input label="Full Name" required value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} />
          <Input label="Email" type="email" required value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} disabled={!!selectedManager} />
          {!selectedManager && (
            <Input label="Password" type="password" required value={formData.password} onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} />
          )}
          <Input label="Phone" type="tel" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} />
          {selectedManager && (
            <Select label="Status" value={formData.isActive} onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}>
              <option value={true}>Active</option>
              <option value={false}>Inactive</option>
            </Select>
          )}
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setShowManagerForm(false)}>Cancel</Button>
            <Button onClick={handleSaveManager}>{selectedManager ? 'Update Manager' : 'Create Manager'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
