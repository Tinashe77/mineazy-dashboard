// src/pages/UsersPage.jsx
import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout';
import { Button, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Modal, Input, Select, Alert } from '../components/ui';
import { formatDate, getStatusVariant } from '../utils';
import { Plus, Edit, Trash2, User, ShieldCheck } from 'lucide-react';
import api from '../services/api';

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modals state
  const [showUserForm, setShowUserForm] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // Data for modals
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);

  // State for the "Create User" form
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'customer',
  });

  // Separate state for the "Update Role" modal
  const [editingRole, setEditingRole] = useState('');

  const roleOptions = [
    { value: 'customer', label: 'Customer' },
    { value: 'shop_manager', label: 'Shop Manager' },
    { value: 'admin', label: 'Admin' },
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getUsers({ limit: 50 });
      setUsers(response.users || []);
    } catch (err) {
      setError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', phone: '', role: 'customer' });
    setSelectedUser(null);
  };

  // User Creation
  const openCreateUserForm = () => {
    resetForm();
    setShowUserForm(true);
  };

  const handleCreateUser = async () => {
    try {
      const { name, email, password, phone, role } = formData;
      // Construct payload carefully to avoid validation issues with optional fields
      const dataToSend = { name, email, password, role };
      if (phone) {
        dataToSend.phone = phone;
      }

      await api.createUser(dataToSend);
      await loadUsers();
      setShowUserForm(false);
      resetForm();
    } catch (err) {
      setError('Failed to create user: ' + (err.data?.message || err.message));
    }
  };

  // User Deletion
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await api.deleteUser(userId);
      await loadUsers();
    } catch (err) {
      setError('Failed to delete user: ' + (err.data?.message || err.message));
    }
  };

  // Role Management
  const openRoleModal = (user) => {
    setSelectedUser(user);
    setEditingRole(user.roles.length > 0 ? user.roles[0].name : 'customer');
    setShowRoleModal(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    try {
      await api.updateUserRole(selectedUser._id, editingRole);
      await loadUsers();
      setShowRoleModal(false);
    } catch (err) {
      setError('Failed to update role: ' + (err.data?.message || err.message));
    }
  };

  // Permission Management
  const openPermissionModal = async (user) => {
    setSelectedUser(user);
    try {
      setLoading(true);
      const perms = await api.getUserPermissions(user._id);
      setUserPermissions(perms.permissions || []);
      setShowPermissionModal(true);
    } catch (err) {
      setError('Failed to load permissions: ' + (err.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRevokePermission = async (permissionId) => {
    if (!selectedUser || !permissionId) return;
    if (!window.confirm('Are you sure you want to revoke this permission?')) return;
    try {
      await api.revokeUserPermission(selectedUser._id, permissionId);
      const perms = await api.getUserPermissions(selectedUser._id);
      setUserPermissions(perms.permissions || []);
    } catch (err) {
      setError('Failed to revoke permission: ' + (err.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users Management"
        subtitle="Manage system users, roles, and permissions"
      >
        <Button onClick={openCreateUserForm}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </PageHeader>

      {error && <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div></TableCell></TableRow>
            ) : users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0"><div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center"><User className="h-5 w-5 text-primary-600" /></div></div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.roles && user.roles.length > 0 ? user.roles.map(role => (
                      <Badge key={role._id || role.name} variant="info">{role.name.replace('_', ' ').toUpperCase()}</Badge>
                    )) : <Badge variant="secondary">NO ROLE</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(user.isActive ? 'active' : 'inactive')}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(user.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => openRoleModal(user)} title="Manage Roles"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => openPermissionModal(user)} title="Manage Permissions"><ShieldCheck className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user._id)} title="Delete User"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {users.length === 0 && !loading && (
          <div className="text-center py-12"><User className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3><p className="mt-1 text-sm text-gray-500">Get started by creating a new user.</p></div>
        )}
      </div>

      {/* Create User Modal */}
      <Modal isOpen={showUserForm} onClose={() => setShowUserForm(false)} title="Add New User">
        <div className="space-y-4">
          <Input label="Full Name" required value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} />
          <Input label="Email" type="email" required value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} />
          <Input label="Password" type="password" required value={formData.password} onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} />
          <Input label="Phone (optional)" type="tel" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} />
          <Select label="Role" required value={formData.role} onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}>
            {roleOptions.map(option => (<option key={option.value} value={option.value}>{option.label}</option>))}
          </Select>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setShowUserForm(false)}>Cancel</Button>
            <Button onClick={handleCreateUser}>Create User</Button>
          </div>
        </div>
      </Modal>

      {/* Update Role Modal */}
      <Modal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} title={`Update Role for ${selectedUser?.name}`}>
        <div className="space-y-4">
          <p>Select a new primary role for the user. This will replace all current roles.</p>
          <Select label="Role" required value={editingRole} onChange={(e) => setEditingRole(e.target.value)}>
            {roleOptions.map(option => (<option key={option.value} value={option.value}>{option.label}</option>))}
          </Select>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setShowRoleModal(false)}>Cancel</Button>
            <Button onClick={handleUpdateRole}>Update Role</Button>
          </div>
        </div>
      </Modal>

      {/* Permissions Modal */}
      <Modal isOpen={showPermissionModal} onClose={() => setShowPermissionModal(false)} title={`Permissions for ${selectedUser?.name}`}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">This user has the following permissions derived from their roles. You can revoke permissions if necessary.</p>
          {loading && <p>Loading permissions...</p>}
          {userPermissions.length > 0 ? (
            <ul className="space-y-2 max-h-80 overflow-y-auto">
              {userPermissions.map(perm => (
                <li key={perm._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{perm.name} <span className="text-xs text-gray-500">({perm.action} on {perm.resource})</span></p>
                    <p className="text-xs text-gray-500">{perm.description}</p>
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => handleRevokePermission(perm._id)}>Revoke</Button>
                </li>
              ))}
            </ul>
          ) : (
            <p>This user has no assigned permissions.</p>
          )}
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setShowPermissionModal(false)}>Close</Button>
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