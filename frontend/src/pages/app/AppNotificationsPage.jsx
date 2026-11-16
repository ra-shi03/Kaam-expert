import { Bell, CheckCheck } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications.js'
import { NotificationList } from '../../components/app/NotificationList.jsx'
import { AppEmptyState } from '../../components/app/AppEmptyState.jsx'
import { AppStackScreenHeader } from '../../components/app/AppStackScreenHeader.jsx'

/** Notification inbox for customers and contractors (labour has its own page with this list at the top). */
export function AppNotificationsPage() {
  const { items, unreadCount, loading, markRead, markAllRead } = useNotifications({ limit: 50 })

  return (
    <div className="pb-6">
      <AppStackScreenHeader title="Notifications" backTo="/app" />

      {unreadCount > 0 ? (
        <button
          type="button"
          onClick={markAllRead}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 active:scale-[0.99]"
        >
          <CheckCheck className="h-4 w-4" aria-hidden />
          Mark all as read ({unreadCount})
        </button>
      ) : null}

      {loading ? (
        <p className="py-10 text-center text-sm font-medium text-slate-500">Loading…</p>
      ) : items.length === 0 ? (
        <AppEmptyState icon={Bell} title="No notifications yet" subtitle="Booking updates, reminders and payment alerts will show up here." />
      ) : (
        <NotificationList items={items} onRead={markRead} />
      )}
    </div>
  )
}
