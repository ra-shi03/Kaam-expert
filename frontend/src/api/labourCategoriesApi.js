import { apiRequest } from './http.js'

const groupedCache = new Map()
const groupedPending = new Map()
let lastGroupedKey = ''

export function fetchLabourCategoriesGrouped(lat, lng, city, address) {
  const params = new URLSearchParams()
  if (lat != null) params.append('lat', lat)
  if (lng != null) params.append('lng', lng)
  if (city) params.append('city', city)
  if (address) params.append('address', address)
  const qs = params.toString()
  const key = qs || 'all'
  lastGroupedKey = key

  if (groupedCache.has(key)) {
    return Promise.resolve(groupedCache.get(key))
  }

  if (groupedPending.has(key)) {
    return groupedPending.get(key)
  }

  const promise = apiRequest(`/labour-categories/grouped${qs ? '?' + qs : ''}`, { skipAuth: true })
    .then((res) => {
      groupedCache.set(key, res)
      groupedPending.delete(key)
      return res
    })
    .catch((err) => {
      groupedPending.delete(key)
      throw err
    })
  groupedPending.set(key, promise)
  return promise
}

export function getCachedLabourCategoriesGrouped() {
  return groupedCache.get(lastGroupedKey) || null
}

export function invalidateLabourCategoriesCache() {
  groupedCache.clear()
  groupedPending.clear()
  lastGroupedKey = ''
}
