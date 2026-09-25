import { apiClient } from './client.js';

export const authApi = {
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  signup: (data) => apiClient.post('/auth/signup', data),
  registerAdmin: (data) => apiClient.post('/auth/register-admin', data),
  getUsers: () => apiClient.get('/auth/users'),
  createUser: (data) => apiClient.post('/auth/users', data),
  updateUserRole: (id, role) => apiClient.patch(`/auth/users/${id}/role`, { role }),
  deleteUser: (id) => apiClient.delete(`/auth/users/${id}`),
  getMe: () => apiClient.get('/auth/me'),
};
