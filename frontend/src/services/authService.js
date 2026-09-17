import { request, setAuthToken } from './api';

export const authService = {
  async register(data) {
    return await request('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async login(username, password) {
    const res = await request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (res.token) {
      setAuthToken(res.token);
    }
    return res;
  },

  async logout() {
    try {
      await request('/auth/logout/', { method: 'POST' });
    } catch (_) {
      // Clean local storage even if token invalid
    } finally {
      setAuthToken(null);
    }
  },

  async getProfile() {
    return await request('/profile/', { method: 'GET' });
  },
};
