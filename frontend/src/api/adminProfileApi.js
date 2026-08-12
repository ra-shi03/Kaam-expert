import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1/admin',
  withCredentials: true,
});

export const getAdminProfile = async () => {
  return api.get('/profile');
};

export const updateAdminProfile = async (payload) => {
  return api.patch('/profile', payload);
};

export const changeAdminPassword = async (payload) => {
  return api.patch('/profile/password', payload);
};
