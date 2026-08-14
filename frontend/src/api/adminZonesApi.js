import { apiRequest } from './http.js'

export const adminZonesApi = {
  getActiveZones: () => apiRequest('/admin/zones', { method: 'GET' }),
  getAllZones: (params) => {
    const q = new URLSearchParams(params).toString()
    return apiRequest(`/admin/zones/list?${q}`, { method: 'GET' })
  },
  createZone: (payload) => apiRequest('/admin/zones', { method: 'POST', body: payload }),
  updateZone: (id, payload) => apiRequest(`/admin/zones/${id}`, { method: 'PUT', body: payload }),
  toggleZoneStatus: (id) => apiRequest(`/admin/zones/${id}/status`, { method: 'PATCH' }),
  deleteZone: (id) => apiRequest(`/admin/zones/${id}`, { method: 'DELETE' }),
  
  getZoneSettings: () => apiRequest('/admin/zones/settings', { method: 'GET' }),
  updateZoneSettings: (payload) => apiRequest('/admin/zones/settings', { method: 'PUT', body: payload }),
  getZoneStatistics: () => apiRequest('/admin/zones/statistics', { method: 'GET' }),
}
