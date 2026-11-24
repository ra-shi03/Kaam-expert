import { apiRequest } from './http.js'

// Several components poll pending offers; share one in-flight request and
// reuse the last result for a few seconds so they never stack up duplicate calls.
const PENDING_CACHE_MS = 4000
let pendingInFlight = null
let pendingLastAt = 0
let pendingLastResult = null

export const broadcastsApi = {
  getPendingBroadcasts: () => {
    if (pendingInFlight) return pendingInFlight
    if (pendingLastResult && Date.now() - pendingLastAt < PENDING_CACHE_MS) {
      return Promise.resolve(pendingLastResult)
    }
    pendingInFlight = apiRequest('/broadcasts/pending')
      .then((res) => {
        pendingLastResult = res
        pendingLastAt = Date.now()
        return res
      })
      .finally(() => {
        pendingInFlight = null
      })
    return pendingInFlight
  },

  acceptBroadcast: (logId, data = {}) => {
    return apiRequest(`/broadcasts/${logId}/accept`, { method: 'POST', body: JSON.stringify(data) })
  },

  rejectBroadcast: (logId) => {
    return apiRequest(`/broadcasts/${logId}/reject`, { method: 'POST' })
  },
}
