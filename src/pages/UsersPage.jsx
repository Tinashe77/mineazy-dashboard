// src/pages/UsersPage.jsx
import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout';
import { Button, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Modal, Input, Select, Alert } from '../components/ui';
import { formatDate, getStatusVariant } from '../utils';
import { Plus, Edit, Trash2, User } from 'lucide-react';
import api from '../services/api';

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'customer',
    branch: '',
    status: 'active',
  });

  useEffect(() => {
    loadUsers();
    loadBranches();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.getUsers({ limit: 50 });
      setUsers(response.users || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      const response = await api.getBranches();
      setBranches(response.data || []);
    } catch (error) {
      console.error('Failed to load branches:', error);
    }
  };

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState(null);
  const [editingRole, setEditingRole] = useState('');

  const handleSaveUser = async () => {
    try {
      if (selectedUser) {
        // This is now only for role updates, we'll use a separate modal
        await api.updateUserRole(selectedUser.id || selectedUser._id, editingRole);
      } else {
        await api.createUser(formData);
      }
      await loadUsers();
      setShowUserForm(false);
      setShowRoleModal(false);
      resetForm();
    } catch (error) {
      setError('Failed to save user: ' + error.message);
    }
  };

  const openRoleModal = (user) => {
    setSelectedUserForRole(user);
    setEditingRole(user.role || 'customer');
    setShowRoleModal(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedUserForRole) return;
    try {
      await api.updateUserRole(selectedUserForRole.id || selectedUserForRole._id, editingRole);
      await loadUsers();
      setShowRoleModal(false);
    } catch (err) {
      setError('Failed to update role: ' + (err.data?.message || err.message));
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await api.deleteUser(userId);
      await loadUsers();
    } catch (error) {
      setError('Failed to delete user: ' + error.message);
    }
  };

  const openUserForm = (user = null) => {
    setSelectedUser(user);
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        phone: user.phone || '',
        role: user.role || 'customer',
        branch: user.branch || '',
        status: user.status || 'active',
      });
    } else {
      resetForm();
    }
    setShowUserForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      role: 'customer',
      branch: '',
      status: 'active',
    });
    setSelectedUser(null);
  };

  const roleOptions = [
    { value: 'customer', label: 'Customer' },
    { value: 'shop_manager', label: 'Shop Manager' },
    { value: 'admin', label: 'Admin' },
    { value: 'super_admin', label: 'Super Admin' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users Management"
        subtitle="Manage system users and their permissions"
      >
        <Button onClick={() => openUserForm()}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </PageHeader>

      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </TableCell>
              </TableRow>
            ) : users.map((user) => (
              <TableRow key={user.id || user._id}>
                <TableCell>
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.roles && user.roles.length > 0 ? (
                      user.roles.map(role => (
                        <Badge key={role._id || role.name} variant="info">
                          {role.name?.replace('_', ' ').toUpperCase()}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="secondary">NO ROLE</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {user.branch || 'All Branches'}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(user.status || 'active')}>
                    {user.status || 'active'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {formatDate(user.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openRoleModal(user)}
                      title="Manage Role"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id || user._id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {users.length === 0 && !loading && (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new user.</p>
          </div>
        )}
      </div>

      {/* User Form Modal */}
      <Modal
        isOpen={showUserForm}
        onClose={() => setShowUserForm(false)}
        title={selectedUser ? 'Edit User' : 'Add New User'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Full Name"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
            <Input
              label="Email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={selectedUser ? 'New Password (leave blank to keep current)' : 'Password'}
              type="password"
              required={!selectedUser}
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            />
            <div>
              <Input
                label="Phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                pattern="^\+?[1-9]\d{1,14}$"
                title="Phone number must be in international E.164 format (e.g., +263771234567)"
              />
              {!selectedUser && (
                <p className="text-xs text-gray-500 mt-1">
                  Required. Must be in international format.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Role"
              required
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
            >
              {roleOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>

            <Select
              label="Branch"
              value={formData.branch}
              onChange={(e) => setFormData(prev => ({ ...prev, branch: e.target.value }))}
            >
              <option value="">All Branches</option>
              {branches.map(branch => (
                <option key={branch.id || branch._id} value={branch.id || branch._id}>
                  {branch.name}
                </option>
              ))}
            </Select>
          </div>

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowUserForm(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveUser}>
              {selectedUser ? 'Update User' : 'Create User'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Update Role Modal */}
      <Modal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title={`Update Role for ${selectedUserForRole?.name}`}
      >
        <div className="space-y-4">
          <p>Select a new primary role for the user. This will replace all current roles.</p>
          <Select
            label="Role"
            required
            value={editingRole}
            onChange={(e) => setEditingRole(e.target.value)}
          >
            {roleOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setShowRoleModal(false)}>Cancel</Button>
            <Button onClick={handleUpdateRole}>Update Role</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Placeholder pages for the remaining modules
export const BranchesPage = () => (
  <div className="space-y-6">
    <PageHeader
      title="Branches Management"
      subtitle="Manage your mining equipment distribution centers"
    />
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-500">Branches management functionality coming soon...</p>
    </div>
  </div>
);

export const PaymentsPage = () => (
  <div className="space-y-6">
    <PageHeader
      title="Payments & Transactions"
      subtitle="Monitor payment transactions and financial data"
    />
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-500">Payments management functionality coming soon...</p>
    </div>
  </div>
);

export const ReportsPage = () => (
  <div className="space-y-6">
    <PageHeader
      title="Reports & Analytics"
      subtitle="Generate comprehensive business reports"
    />
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-500">Reports functionality coming soon...</p>
    </div>
  </div>
);

export const InquiriesPage = () => (
  <div className="space-y-6">
    <PageHeader
      title="Customer Inquiries"
      subtitle="Manage customer contact requests and support tickets"
    />
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-500">Inquiries management functionality coming soon...</p>
    </div>
  </div>
);

export const AuditPage = () => (
  <div className="space-y-6">
    <PageHeader
      title="Audit Logs"
      subtitle="Monitor system security and user activities"
    />
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-500">Audit logs functionality coming soon...</p>
    </div>
  </div>
);

export const SettingsPage = () => (
  <div className="space-y-6">
    <PageHeader
      title="Settings"
      subtitle="Configure system preferences and account settings"
    />
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-500">Settings functionality coming soon...</p>
    </div>
  </div>
);