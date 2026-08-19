import { apiRequest } from './http.js'

export function fetchLabourCategoriesGrouped(lat, lng, city, address) {
  const params = new URLSearchParams()
  if (lat != null) params.append('lat', lat)
  if (lng != null) params.append('lng', lng)
  if (city) params.append('city', city)
  if (address) params.append('address', address)
  const qs = params.toString()
  return apiRequest(`/labour-categories/grouped${qs ? '?' + qs : ''}`, { skipAuth: true })
}
