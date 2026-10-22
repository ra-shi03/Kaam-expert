import { apiRequest } from './http.js'

let cachedGroupedData = null
let cachedGroupedKey = ''
let pendingGroupedPromise = null

export function fetchLabourCategoriesGrouped(lat, lng, city, address) {
  const params = new URLSearchParams()
  if (lat != null) params.append('lat', lat)
  if (lng != null) params.append('lng', lng)
  if (city) params.append('city', city)
  if (address) params.append('address', address)
  const qs = params.toString()
  const key = qs || 'all'

  if (cachedGroupedData && cachedGroupedKey === key) {
    return Promise.resolve(cachedGroupedData)
  }

  if (pendingGroupedPromise && cachedGroupedKey === key) {
    return pendingGroupedPromise
  }

  cachedGroupedKey = key
  pendingGroupedPromise = apiRequest(`/labour-categories/grouped${qs ? '?' + qs : ''}`, { skipAuth: true })
    .then((res) => {
      cachedGroupedData = res
      pendingGroupedPromise = null
      return res
    })
    .catch((err) => {
      pendingGroupedPromise = null
      throw err
    })

  return pendingGroupedPromise
}

export function getCachedLabourCategoriesGrouped() {
  return cachedGroupedData
}

export function invalidateLabourCategoriesCache() {
  cachedGroupedData = null
  cachedGroupedKey = ''
  pendingGroupedPromise = null
}
