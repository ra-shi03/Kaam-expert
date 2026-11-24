import { Link } from 'react-router-dom'
import { Star, Briefcase } from 'lucide-react'
import { AppListSkeleton } from '../../app-ui/feedback/AppListSkeleton.jsx'
import { getCategoryImageUrl } from '../../../lib/labourCategoryDisplay.js'

/** Real admin-uploaded image (subcategory, then service icon); null when none exists. */
function bookingImage(b) {
  const sub = b.subcategoryId
  const svc = b.serviceId
  const raw = [sub?.imageUrl, svc?.iconUrl, svc?.imageUrl]
    .map((u) => String(u || '').trim())
    .find(Boolean)
  if (!raw) return null
  return getCategoryImageUrl({ imageUrl: raw })
}

export function IndividualHomeRecentlyBooked({ bookings, loading, formatDay }) {
  if (loading) {
    return (
      <section className="mb-6" aria-label="Recently booked">
        <div className="lc-home-section-head">
          <h3>Recently booked</h3>
        </div>
        <AppListSkeleton rows={1} className="h-44" />
      </section>
    )
  }

  if (!bookings?.length) {
    return null
  }

  return (
    <section className="mb-6" aria-label="Recently booked">
      <div className="lc-home-section-head">
        <h3>Ongoing bookings</h3>
        <Link to="/app/bookings" className="lc-home-view-all">
          View all &gt;
        </Link>
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden">
        {bookings.map((b) => {
          const itemLabel = b.serviceId?.name || b.subcategoryId?.name || 'Labour booking'
          const day = formatDay(b.scheduledAt || b.createdAt)
          const img = bookingImage(b)
            
          let statusLabel = 'Active request'
          let statusColor = 'text-brand'
          let StatusIcon = Star
          
          if (b.status === 'BROADCASTING') {
            statusLabel = 'Finding labour...'
            statusColor = 'text-amber-500'
          } else if (b.status === 'ACCEPTED' || b.status === 'EN_ROUTE') {
            statusLabel = 'Worker assigned'
            statusColor = 'text-blue-600'
          } else if (b.status === 'STARTED') {
            statusLabel = 'Work in progress'
            statusColor = 'text-sky-500'
          }

          return (
            <Link
              key={b._id}
              to={`/app/tracking/${b._id}`}
              className="flex w-[280px] shrink-0 snap-start items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition hover:border-brand/30 hover:shadow-md"
            >
              {img ? (
                <img src={img} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" loading="lazy" />
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Briefcase className="h-6 w-6" aria-hidden />
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className="line-clamp-1 text-sm font-bold text-slate-900">{itemLabel}</p>
                <p className="mt-0.5 line-clamp-1 text-[11px] font-medium text-slate-500">
                  {day} · {b.type === 'SCHEDULED' ? 'Scheduled' : 'Instant'}
                </p>
                <p className={`mt-1 flex items-center gap-1 text-[10px] font-semibold ${statusColor}`}>
                  <StatusIcon className="h-3 w-3 fill-current" aria-hidden />
                  {statusLabel}
                </p>
              </div>
              <div className="flex shrink-0 items-center justify-center rounded-full bg-brand/10 px-3 py-1.5 text-[10px] font-extrabold text-brand uppercase tracking-wider">
                Track
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
