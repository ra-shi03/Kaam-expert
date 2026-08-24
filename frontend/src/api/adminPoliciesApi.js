import { apiRequest } from './http.js'

export const adminPoliciesApi = {
  getPolicy: (type, role) => apiRequest(`/policies/${type}/${role}`),
  updatePolicy: (type, role, data) =>
    apiRequest(`/policies/${type}/${role}`, { method: 'PUT', body: data }),
}
