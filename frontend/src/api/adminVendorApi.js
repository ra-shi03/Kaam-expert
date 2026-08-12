import { apiRequest } from './http.js'

export function fetchAdminVendorsAndCrew() {
  return apiRequest('/admin/vendors/crew')
}

export function fetchAdminVendorCrewById(id) {
  return apiRequest(`/admin/vendors/crew-labour/${id}`)
}

export function updateVendorCrewVerification(id, data) {
  return apiRequest(`/admin/vendors/crew-labour/${id}/verification`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export function deleteVendorCrew(id) {
  return apiRequest(`/admin/vendors/crew-labour/${id}`, {
    method: 'DELETE'
  })
}
