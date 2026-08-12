import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1/admin/reports',
  withCredentials: true,
});

export const getDashboardStats = async () => {
  return api.get('/stats');
};
