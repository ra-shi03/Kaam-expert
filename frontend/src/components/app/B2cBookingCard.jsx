import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Calendar, CreditCard, MapPin, User, Loader2, Plus, Minus, Clock, CheckCircle } from 'lucide-react'
import { GlassPanel } from '../ui/GlassPanel.jsx'
import { bookingsApi } from '../../api/bookingsApi.js'
import { getLabourBookingShare } from '../../lib/bookingLabourShare.js'
import { calculateEndTime, formatTime12 } from '../../lib/bookingTimeUtils.js'

const STATUS_STYLES = {
  CREATED: 'bg-amber-100 text-amber-800 border-amber-200',
  ACCEPTED: 'bg-blue-100 text-blue-800 border-blue-200',
  EN_ROUTE: 'bg-purple-100 text-purple-800 border-purple-200',
  STARTED: 'bg-blue-100 text-blue-800 border-blue-200',
  PAYMENT_PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  COMPLETED: 'bg-slate-100 text-slate-800 border-slate-200',
  CANCELLED: 'bg-rose-100 text-rose-800 border-rose-200',
}

export function B2cBookingCard({ booking, isLabour }) {
  const navigate = useNavigate()
  const authUser = useSelector((state) => state.auth.user)
  const status = (booking.status || 'CREATED').toUpperCase()
  const isPaid = (booking.paymentStatus || '').toUpperCase() === 'PAID'
  
  let displayStatus = status
  if (status === 'COMPLETED' && !isPaid) {
    displayStatus = 'PAYMENT_PENDING'
  }
  
  const subcategory = typeof booking.subcategoryId === 'object' ? booking.subcategoryId : null
  const isActive = (status !== 'COMPLETED' || !isPaid) && status !== 'CANCELLED'

  const displayStartOtp = booking.assignments?.length > 0 ? booking.assignments[0].startOtp : booking.startOtp;
  const displayCompletionOtp = booking.assignments?.length > 0 ? booking.assignments[0].completionOtp : booking.completionOtp;

  const [loadingTime, setLoadingTime] = useState(null)
  const [slotModalTarget, setSlotModalTarget] = useState(null)
  const [selectedSlotForExtra, setSelectedSlotForExtra] = useState(null)
  const [successModalOpen, setSuccessModalOpen] = useState(false)

  return (
    <>
    <GlassPanel
      className="cursor-pointer overflow-hidden p-0 transition-all hover:shadow-lg border-slate-200/60"
      onClick={() => {
        if (isActive) {
          if (isLabour) {
            navigate(`/app/active-job/${booking._id}`)
          } else if (status === 'COMPLETED' && !isPaid) {
             navigate(`/app/booking/flow?bookingId=${booking._id}&step=billing`)
          } else {
             navigate(`/app/tracking/${booking._id}`)
          }
        }
      }}
    >
      <div className="flex flex-col">
        {/* Header Section */}
        <div className="flex items-start justify-between p-4 pb-3 border-b border-slate-100/80 bg-white/50">
          <div className="min-w-0 flex-1 pr-3">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm ${STATUS_STYLES[displayStatus] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                {displayStatus.replace('_', ' ')}
              </span>
              {booking.type && !isPaid && (
                <>
                  <span className="text-[10px] font-bold text-slate-400">•</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{booking.type}</span>
                </>
              )}
            </div>
            <p className="truncate text-base font-extrabold text-slate-900 leading-tight">
              {booking.contractorInfo?.services?.length > 0
                ? booking.contractorInfo.services.map(s => s.serviceId?.name || s.name || 'Service').join(', ')
                : (booking.serviceId?.name || subcategory?.name || 'Service Booking')}
            </p>
            {(!booking.contractorInfo?.services || booking.contractorInfo.services.length === 0) && subcategory?.name && (
                <p className="truncate text-xs text-slate-500 font-medium mt-1">
                  {subcategory.name}
                </p>
            )}
          </div>
          <div className="flex flex-col items-end shrink-0 pl-2">
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                {isLabour ? 'Your Share' : 'Amount'}
              </p>
              <span className="text-lg font-black text-brand">
                ₹{isLabour
                  ? Math.round(getLabourBookingShare(booking, authUser?._id)).toLocaleString('en-IN')
                  : (Number(booking.totalAmount) || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="flex flex-col gap-3 p-4 bg-slate-50/50">
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white shadow-sm border border-slate-100 shrink-0">
              <Calendar className="h-4 w-4 text-brand" />
            </div>
            <span className="font-semibold truncate">
              {booking.type === 'SCHEDULED' && booking.scheduledAt
                ? (() => {
                    const formattedDate = new Date(booking.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    const start = formatTime12(booking.timeSlot)
                    const end = formatTime12(booking.endTime || calculateEndTime(booking.timeSlot, booking.durationMinutes || (booking.hours ? booking.hours * 60 : 60)))
                    return `${formattedDate} at ${start || ''}${end ? ` – ${end}` : ''}`
                  })()
                : booking.createdAt 
                  ? new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-700">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white shadow-sm border border-slate-100 shrink-0">
              <Clock className="h-4 w-4 text-brand" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">
                {booking.selectedSlotLabel || (booking.durationMinutes ? `${booking.durationMinutes} min` : (booking.hours ? (booking.hours < 1 ? `${Math.round(booking.hours * 60)} min` : `${+Number(booking.hours).toFixed(1)} hrs`) : '1 hr'))}
              </span>
              {booking.extraSlotLabel && (
                <span className="text-[10px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                  +{booking.extraSlotLabel}
                </span>
              )}
            </div>
          </div>
          
          {booking.address?.locationText && (
            <div className="flex items-start gap-3 text-sm text-slate-700">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white shadow-sm border border-slate-100 shrink-0 mt-0.5">
                <MapPin className="h-4 w-4 text-brand" />
              </div>
              <span className="line-clamp-2 leading-snug mt-1 font-medium text-slate-600">{booking.address.locationText}</span>
            </div>
          )}

          {isLabour ? (
            booking.userId && (
              <div className="flex items-center gap-3 text-sm text-slate-700 mt-2 pt-3 border-t border-slate-100/80">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white shadow-sm border border-slate-100 shrink-0">
                  <User className="h-4 w-4 text-brand" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Customer</span>
                  <span className="font-bold leading-tight text-slate-800">
                    {`${booking.userId?.fullName || 'Guest'} ${booking.userId?.phone ? `• ${booking.userId.phone}` : ''}`}
                  </span>
                </div>
              </div>
            )
          ) : (
            (booking.quantity > 1 || (booking.contractorInfo?.services && booking.contractorInfo.services.length > 0) || (booking.assignments && booking.assignments.length > 0)) ? (
              <div className="mt-2 pt-3 border-t border-slate-100/80 space-y-3">
                {Array.from({ length: Math.max(booking.quantity || 1, booking.assignments?.length || 0) }).map((_, idx) => {
                  const assignment = booking.assignments?.[idx];
                  const profNum = (booking.quantity > 1 || (booking.assignments?.length || 0) > 1) ? ` ${idx + 1}` : '';
                  return (
                    <div key={idx} className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3 text-sm text-slate-700">
                        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 shadow-sm border border-slate-200 shrink-0">
                          <User className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Professional{profNum}</span>
                          <span className={`font-bold leading-tight ${assignment ? 'text-slate-800' : 'text-slate-400'}`}>
                            {assignment 
                              ? `${assignment.labourId?.fullName || assignment.labourId?.name || 'Assigned'} ${assignment.labourId?.phone ? `• ${assignment.labourId.phone}` : ''}`
                              : 'Pending Acceptance'}
                          </span>
                        </div>
                      </div>
                      {(!isLabour) && assignment && (assignment.startOtp || assignment.completionOtp) && (
                        <div className="flex gap-2 w-full mt-2">
                          {assignment.startOtp && (
                            <div className="flex flex-col items-center px-2 py-1.5 bg-blue-50/50 border border-blue-100/50 rounded-lg flex-1">
                              <span className="text-[9px] font-bold text-blue-500/80 uppercase tracking-wider mb-0.5">Start OTP</span>
                              <span className="text-sm font-black text-blue-700 leading-none">{assignment.startOtp}</span>
                            </div>
                          )}
                          {assignment.completionOtp && (
                            <div className="flex flex-col items-center px-2 py-1.5 bg-purple-50/50 border border-purple-100/50 rounded-lg flex-1">
                              <span className="text-[9px] font-bold text-purple-500/80 uppercase tracking-wider mb-0.5">End OTP</span>
                              <span className="text-sm font-black text-purple-700 leading-none">{assignment.completionOtp}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {!isLabour && ['ACCEPTED', 'EN_ROUTE', 'STARTED', 'COMPLETED'].includes(status) && !isPaid && assignment && (
                        <div className="w-full mt-2 flex items-center justify-between bg-white rounded-lg p-2 border border-slate-100" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-semibold text-slate-600">Extra Time</span>
                            {assignment.extraHours > 0 && <span className="text-[10px] font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded">+{assignment.extraSlotLabel || `${assignment.extraHours}h`} added</span>}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSlotModalTarget(assignment.labourId?._id)
                            }}
                            className="flex items-center gap-1 text-[11px] font-bold text-brand bg-brand/10 hover:bg-brand/20 px-2.5 py-1 rounded-lg transition"
                          >
                            <Plus className="w-3 h-3" /> Add Time
                          </button>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            ) : booking.laborId ? (
            <>
              <div className="flex items-center gap-3 text-sm text-slate-700 mt-2 pt-3 border-t border-slate-100/80">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white shadow-sm border border-slate-100 shrink-0">
                  <User className="h-4 w-4 text-brand" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Professional</span>
                  <span className="font-bold leading-tight text-slate-800">
                    {`${booking.laborId?.fullName || booking.laborId?.name || 'Assigned'} ${booking.laborId?.phone ? `• ${booking.laborId.phone}` : ''}`}
                  </span>
                </div>
              </div>
              
              {!isLabour && ['ACCEPTED', 'EN_ROUTE', 'STARTED', 'COMPLETED'].includes(status) && !isPaid && (
                <div className="w-full mt-2 flex items-center justify-between bg-white rounded-lg p-2 border border-slate-100" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-600">Extra Time</span>
                    {booking.extraHours > 0 && <span className="text-[10px] font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded">+{booking.extraSlotLabel || `${booking.extraHours}h`} added</span>}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSlotModalTarget('main')
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold text-brand bg-brand/10 hover:bg-brand/20 px-2.5 py-1 rounded-lg transition"
                  >
                    <Plus className="w-3 h-3" /> Add Time
                  </button>
                </div>
              )}

            </>
            ) : null
          )}
        </div>

        {/* Footer Section */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 pt-3 border-t border-slate-100/80 bg-white">
          {booking.paymentMethod ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded bg-slate-50 border border-slate-100 shrink-0">
                  <CreditCard className="h-3 w-3 text-slate-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Payment</span>
                  <div className="flex items-center gap-1.5 text-xs mt-0.5">
                    <span className="font-extrabold text-slate-700">{booking.paymentMethod}</span>
                    <span className="text-[10px] text-slate-300">•</span>
                    <span className={`font-bold ${booking.paymentStatus === 'COMPLETED' ? 'text-blue-600' : 'text-amber-600'}`}>
                      {booking.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>
          ) : <div />}
          
          {(!booking.assignments || booking.assignments.length === 0) && (booking.quantity === 1 || !booking.quantity) && (!booking.contractorInfo?.services || booking.contractorInfo.services.length === 0) && (booking.startOtp || booking.completionOtp) && !isLabour && (
            <div className="flex gap-2">
              {booking.startOtp && (
                <div className="flex flex-col items-center px-3 py-1.5 bg-blue-50/50 border border-blue-100/50 rounded-lg">
                  <span className="text-[9px] font-bold text-blue-500/80 uppercase tracking-wider mb-0.5">Start OTP</span>
                  <span className="text-sm font-black text-blue-700 leading-none">{booking.startOtp}</span>
                </div>
              )}
              {booking.completionOtp && (
                <div className="flex flex-col items-center px-3 py-1.5 bg-purple-50/50 border border-purple-100/50 rounded-lg">
                  <span className="text-[9px] font-bold text-purple-500/80 uppercase tracking-wider mb-0.5">End OTP</span>
                  <span className="text-sm font-black text-purple-700 leading-none">{booking.completionOtp}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </GlassPanel>

    {/* Extra Time Slot Selection Modal */}
    {slotModalTarget && (
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        onClick={(e) => {
          e.stopPropagation()
          setSlotModalTarget(null)
          setSelectedSlotForExtra(null)
        }}
      >
        <div 
          className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-900/5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-brand/10 text-brand">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Extra Time</h3>
                <p className="text-xs text-slate-500">Select duration to add</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSlotModalTarget(null)
                setSelectedSlotForExtra(null)
              }}
              className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4 max-h-48 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/50">
            {[
              { minutes: 15, label: '15 min' },
              { minutes: 30, label: '30 min' },
              { minutes: 45, label: '45 min' },
              { minutes: 60, label: '1 hr' },
              { minutes: 90, label: '1 hr 30 min' },
              { minutes: 120, label: '2 hrs' },
              { minutes: 180, label: '3 hrs' },
              { minutes: 240, label: '4 hrs' },
            ].map((slot) => {
              const isSel = selectedSlotForExtra?.minutes === slot.minutes
              return (
                <button
                  key={slot.minutes}
                  type="button"
                  onClick={() => setSelectedSlotForExtra(slot)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    isSel ? 'border-brand bg-brand/10 ring-2 ring-brand/30' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <p className={`text-xs font-bold ${isSel ? 'text-brand' : 'text-slate-800'}`}>{slot.label}</p>
                </button>
              )
            })}
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSlotModalTarget(null)
                setSelectedSlotForExtra(null)
              }}
              className="rounded-lg px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              disabled={!selectedSlotForExtra || loadingTime}
              onClick={async (e) => {
                e.stopPropagation()
                if (!selectedSlotForExtra) return
                const targetId = slotModalTarget
                setLoadingTime(targetId)
                try {
                  await bookingsApi.addExtraTime(booking._id, {
                    extraMinutes: selectedSlotForExtra.minutes,
                    extraSlotLabel: selectedSlotForExtra.label,
                    extraPrice: selectedSlotForExtra.price,
                    extraHours: +(selectedSlotForExtra.minutes / 60).toFixed(2),
                    assignmentId: targetId !== 'main' ? targetId : undefined
                  })
                  setSlotModalTarget(null)
                  setSelectedSlotForExtra(null)
                  if (status === 'COMPLETED' && !isPaid) {
                    navigate(`/app/booking/flow?bookingId=${booking._id}&step=billing`)
                  } else {
                    setSuccessModalOpen(true)
                  }
                } catch (err) {
                  alert(err.message || 'Failed to add extra time')
                } finally {
                  setLoadingTime(null)
                }
              }}
              className="rounded-lg bg-brand px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-600 transition disabled:opacity-50"
            >
              {loadingTime ? 'Adding...' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Success Modal */}
    {successModalOpen && (
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        onClick={(e) => {
          e.stopPropagation()
          setSuccessModalOpen(false)
          window.location.reload()
        }}
      >
        <div 
          className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-900/5 flex flex-col items-center text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 mb-4">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Time Added</h3>
          <p className="mt-2 text-sm text-slate-500">
            Extra time has been successfully added to this booking.
          </p>
          <div className="mt-6 w-full">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSuccessModalOpen(false)
                window.location.reload()
              }}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition"
            >
              Okay
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
