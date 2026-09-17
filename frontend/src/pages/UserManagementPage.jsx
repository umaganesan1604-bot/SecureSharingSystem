import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import { 
  Users, 
  UserPlus, 
  Search, 
  Shield, 
  UserCheck, 
  UserX, 
  Trash2, 
  Edit, 
  X,
  AlertCircle
} from 'lucide-react';

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', phone: '', role: 'EMPLOYEE' });
  const [userToEditRole, setUserToEditRole] = useState(null);
  const [selectedRole, setSelectedRole] = useState('EMPLOYEE');
  const [userToDelete, setUserToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers(roleFilter, searchQuery);
      setUsers(data);
    } catch (err) {
      showToast(err.message || 'Failed to load users.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadUsers();
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await adminService.createUser(newUser);
      showToast(`User '${newUser.username}' created successfully as ${newUser.role}!`, 'success');
      setIsCreateModalOpen(false);
      setNewUser({ username: '', email: '', password: '', phone: '', role: 'EMPLOYEE' });
      loadUsers();
    } catch (err) {
      showToast(err.message || 'Failed to create user.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!userToEditRole) return;
    try {
      setIsSubmitting(true);
      await adminService.updateUserRole(userToEditRole.id, selectedRole);
      showToast(`Role for '${userToEditRole.username}' updated to ${selectedRole}.`, 'success');
      setUserToEditRole(null);
      loadUsers();
    } catch (err) {
      showToast(err.message || 'Failed to update role.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const res = await adminService.toggleUserStatus(user.id);
      const statusText = res.is_active ? 'activated' : 'deactivated';
      showToast(`Account for '${user.username}' ${statusText}.`, 'info');
      loadUsers();
    } catch (err) {
      showToast(err.message || 'Action failed.', 'error');
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await adminService.deleteUser(userToDelete.id);
      showToast(`User '${userToDelete.username}' deleted permanently.`, 'success');
      setUserToDelete(null);
      loadUsers();
    } catch (err) {
      showToast(err.message || 'Failed to delete user.', 'error');
    }
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '30px 24px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 28,
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={28} color="var(--accent-primary)" />
            Organizational User Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
            Control user lifecycles, manage authorization tiers, and designate administrative permissions.
          </p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <UserPlus size={16} /> Create Organizational User
        </button>
      </div>

      {/* Filter and Search */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: 24 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16
        }}>
          {/* Role Filters */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`btn btn-sm ${roleFilter === '' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setRoleFilter('')}
            >
              All Roles
            </button>
            <button
              className={`btn btn-sm ${roleFilter === 'ADMIN' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setRoleFilter('ADMIN')}
            >
              Admins
            </button>
            <button
              className={`btn btn-sm ${roleFilter === 'MANAGER' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setRoleFilter('MANAGER')}
            >
              Managers
            </button>
            <button
              className={`btn btn-sm ${roleFilter === 'EMPLOYEE' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setRoleFilter('EMPLOYEE')}
            >
              Employees
            </button>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '8px 14px 8px 36px', fontSize: '0.85rem', width: 240 }}
              />
              <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: 12, top: 11 }} />
            </div>
            <button type="submit" className="btn btn-secondary btn-sm">
              Filter
            </button>
          </form>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Work Email</th>
                <th>Phone</th>
                <th>Active Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Governance Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>
                    Loading user directory...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 36, color: 'var(--text-dim)' }}>
                    No users found matching the selected filter.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {u.username} {isSelf && <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>(You)</span>}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{u.email}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{u.phone || '—'}</span>
                      </td>
                      <td>
                        <span className={`badge badge-${u.role}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.is_active ? 'badge-SUCCESS' : 'badge-FAILED'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                          {new Date(u.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setUserToEditRole(u);
                              setSelectedRole(u.role);
                            }}
                            title="Change Role"
                          >
                            <Edit size={13} /> Role
                          </button>

                          {!isSelf && (
                            <button
                              className={`btn btn-sm ${u.is_active ? 'btn-secondary' : 'btn-primary'}`}
                              onClick={() => handleToggleStatus(u)}
                              title={u.is_active ? 'Deactivate User' : 'Activate User'}
                            >
                              {u.is_active ? <UserX size={13} /> : <UserCheck size={13} />}
                            </button>
                          )}

                          {!isSelf && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => setUserToDelete(u)}
                              title="Delete User"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Change Modal */}
      {userToEditRole && (
        <div className="modal-overlay" onClick={() => setUserToEditRole(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 className="modal-title">Modify User Role</h3>
              <button className="modal-close" onClick={() => setUserToEditRole(null)}>
                <X size={18} />
              </button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>
              Adjust organizational privileges for <strong>{userToEditRole.username}</strong>:
            </p>

            <div className="form-group">
              <label className="form-label">Select Role</label>
              <select
                className="form-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="ADMIN">ADMIN (Full administrative access & audit)</option>
                <option value="MANAGER">MANAGER (File upload, sharing & download)</option>
                <option value="EMPLOYEE">EMPLOYEE (Standard document depository)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button className="btn btn-secondary" onClick={() => setUserToEditRole(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleUpdateRole} disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Save Role Change'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 className="modal-title">Create Organizational User</h3>
              <button className="modal-close" onClick={() => setIsCreateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-input"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="e.g. sarah_ops"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="e.g. sarah@org.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Initial Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Minimum 8 characters"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  placeholder="e.g. +1 555-0155"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assigned Role</label>
                <select
                  className="form-select"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting || !newUser.username || !newUser.email || !newUser.password}
                >
                  {isSubmitting ? 'Creating User...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      <ConfirmModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={confirmDeleteUser}
        title="Delete User Account"
        message={`Are you sure you want to permanently delete user account '${userToDelete?.username}'? All associated active sessions and owned resources will be permanently removed.`}
        confirmText="Delete Account"
        isDanger={true}
      />
    </div>
  );
}
