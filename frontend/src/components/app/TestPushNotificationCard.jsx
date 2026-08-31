import { useState, useEffect } from 'react'
import { Bell, CheckCircle2, AlertCircle, Loader2, Send, ShieldCheck, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { sendTestNotification, requestNotificationPermission } from '../../services/pushNotificationService.js'

export function TestPushNotificationCard({ user }) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null) // { type: 'success' | 'error', message: '' }
  const [permission, setPermission] = useState('default')

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const handleTestNotification = async () => {
    setLoading(true)
    setStatus(null)
    try {
      if (!user) {
        throw new Error('Please log in first to test push notifications with your account.')
      }

      await sendTestNotification()
      
      if ('Notification' in window) {
        setPermission(Notification.permission)
      }

      setStatus({
        type: 'success',
        message: 'Push notification triggered! Minimize or switch tabs to view the system banner.'
      })
    } catch (err) {
      console.error('Test notification failed:', err)
      if ('Notification' in window) {
        setPermission(Notification.permission)
      }
      setStatus({
        type: 'error',
        message: err?.message || 'Failed to send test push notification. Please check browser permissions.'
      })
    } finally {
      setLoading(false)
    }
  }

  const permissionBadge = {
    granted: { label: 'Active', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    denied: { label: 'Blocked', bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
    default: { label: 'Prompt Needed', bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  }[permission] || { label: permission, bg: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/50 p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-md shadow-brand/20">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Push Notifications</h3>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${permissionBadge.bg}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${permissionBadge.dot}`} />
                {permissionBadge.label}
              </span>
            </div>
            <p className="text-xs text-slate-500">Test Firebase Cloud Messaging push notifications</p>
          </div>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={handleTestNotification}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-brand/90 active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              <span>Test Push</span>
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className={`flex items-start gap-2 rounded-xl border p-2.5 text-xs font-medium ${
              status.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-rose-200 bg-rose-50 text-rose-900'
            }`}
          >
            {status.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            )}
            <div className="flex-1">
              <p>{status.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
