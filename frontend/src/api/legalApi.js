import { apiRequest } from './http.js'

export const legalApi = {
  getPolicy: (type, role) => apiRequest(`/policies/${type}/${role}`),
}
