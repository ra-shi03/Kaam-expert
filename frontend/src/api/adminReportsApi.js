import { apiRequest } from './http.js';

export const getDashboardStats = async () => {
  return apiRequest('/admin/reports/stats');
};

export const getReportsData = async (params) => {
  const qs = new URLSearchParams(params).toString();
  return apiRequest(`/admin/reports/data?${qs}`);
};
