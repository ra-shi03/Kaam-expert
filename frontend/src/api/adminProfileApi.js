import { apiRequest } from './http.js';

export const getAdminProfile = async () => {
  return apiRequest('/admin/profile', { method: 'GET' });
};

export const updateAdminProfile = async (payload) => {
  return apiRequest('/admin/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
};

export const changeAdminPassword = async (payload) => {
  return apiRequest('/admin/profile/password', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
};
