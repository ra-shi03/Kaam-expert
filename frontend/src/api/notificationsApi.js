import { apiRequest } from './http.js'

/** Server-side notification inbox (everything that was also pushed through Firebase). */
export const notificationsApi = {
  list: ({ limit = 30, page = 1, unread = false } = {}) =>
    apiRequest(`/notifications?limit=${limit}&page=${page}${unread ? '&unread=true' : ''}`),
  unreadCount: () => apiRequest('/notifications/unread-count'),
  markRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () => apiRequest('/notifications/read-all', { method: 'POST' }),
}
