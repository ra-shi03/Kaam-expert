import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { notificationsApi } from '../api/notificationsApi.js'
import { useSocket } from '../context/SocketContext.jsx'

/**
 * Notification inbox for the signed-in user. Loads the list, then stays live:
 * the backend emits NOTIFICATION_NEW over the socket for every notification it also pushes.
 */
export function useNotifications({ limit = 30, enabled = true } = {}) {
  const token = useSelector((s) => s.auth.token)
  const socket = useSocket()
  const [items, setItems] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!token || !enabled) return
    try {
      const res = await notificationsApi.list({ limit })
      setItems(res.data?.notifications || [])
      setUnreadCount(res.data?.unreadCount || 0)
    } catch (err) {
      console.warn('Could not load notifications', err)
    } finally {
      setLoading(false)
    }
  }, [token, enabled, limit])

  useEffect(() => {
    load()
  }, [load])

  // live updates
  useEffect(() => {
    if (!socket || !enabled) return undefined
    const onNew = (n) => {
      setItems((prev) => (prev.some((p) => String(p._id) === String(n._id)) ? prev : [n, ...prev].slice(0, limit)))
      setUnreadCount((c) => c + 1)
    }
    socket.on('NOTIFICATION_NEW', onNew)
    return () => socket.off('NOTIFICATION_NEW', onNew)
  }, [socket, enabled, limit])

  // refresh when the app comes back to the foreground (pushes may have arrived meanwhile)
  useEffect(() => {
    if (!enabled) return undefined
    const onVisible = () => document.visibilityState === 'visible' && load()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [enabled, load])

  const markRead = useCallback(async (id) => {
    setItems((prev) => prev.map((n) => (String(n._id) === String(id) && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n)))
    setUnreadCount((c) => Math.max(0, c - 1))
    try {
      await notificationsApi.markRead(id)
    } catch {
      load()
    }
  }, [load])

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })))
    setUnreadCount(0)
    try {
      await notificationsApi.markAllRead()
    } catch {
      load()
    }
  }, [load])

  return { items, unreadCount, loading, markRead, markAllRead, reload: load }
}
