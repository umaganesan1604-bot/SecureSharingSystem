import { request } from './api';

export const adminService = {
  async getUsers(role = '', search = '') {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (search) params.append('search', search);

    return await request(`/admin/users/?${params.toString()}`, { method: 'GET' });
  },

  async createUser(userData) {
    return await request('/admin/users/create/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async updateUserRole(userId, role) {
    return await request(`/admin/users/${userId}/role/`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  async toggleUserStatus(userId) {
    return await request(`/admin/users/${userId}/status/`, {
      method: 'PATCH',
    });
  },

  async deleteUser(userId) {
    return await request(`/admin/users/${userId}/`, {
      method: 'DELETE',
    });
  },

  async getStats() {
    return await request('/admin/stats/', { method: 'GET' });
  },

  async getAuditLogs(filters = {}) {
    const params = new URLSearchParams();
    if (filters.action) params.append('action', filters.action);
    if (filters.status) params.append('status', filters.status);
    if (filters.username) params.append('username', filters.username);
    if (filters.search) params.append('search', filters.search);

    return await request(`/audit/?${params.toString()}`, { method: 'GET' });
  },
};
