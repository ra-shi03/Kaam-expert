import { apiRequest } from './http.js'

export function fetchActiveBanners(panel) {
  const query = panel ? `&panel=${panel}` : ''
  return apiRequest(`/banners?_t=${Date.now()}${query}`, { skipAuth: true })
}
