import { useCallback, useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  MapPin,
  Navigation,
  Play,
  X,
  Clock,
  Camera,
  Upload,
  Wallet,
} from 'lucide-react'
import { bookingsApi } from '../../api/bookingsApi.js'
import { ApiError } from '../../api/http.js'
import { useSocket } from '../../context/SocketContext.jsx'
import { AppStackScreenHeader } from '../../components/app/AppStackScreenHeader.jsx'
import { GlassPanel } from '../../components/ui/GlassPanel.jsx'
import { uploadMedia, assetUrlFromUpload } from '../../api/uploadApi.js'
import { UPLOAD_FOLDERS } from '../../constants/uploadFolders.js'

const STATUS_CONFIG = {
  ACCEPTED: {
    label: 'Start Journey',
    next: 'EN_ROUTE',
    icon: Navigation,
    color: 'bg-[#1CAE62] shadow-[#1CAE62]/25',
    description: 'Let the customer know you\'re on your way',
  },
  EN_ROUTE: {
    label: 'Start Work',
    next: 'STARTED',
    icon: Play,
    color: 'bg-[#1CAE62] shadow-[#1CAE62]/25',
    description: 'You\'ve arrived — begin the work',
  },
  STARTED: {
    label: 'Finish Job',
    next: 'COMPLETED',
    icon: CheckCircle2,
    color: 'bg-[#1CAE62] shadow-[#1CAE62]/25',
    description: 'Mark the job as completed',
  },
}

const STEP_ORDER = ['ACCEPTED', 'EN_ROUTE', 'STARTED', 'COMPLETED']

export function ActiveJob() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const socket = useSocket()
  const reduce = useReducedMotion()
  const [showPaymentWaiting, setShowPaymentWaiting] = useState(false)
  const mapRef = useRef(null)
  const markerInstance = useRef(null)

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState('')
  
  const [otp, setOtp] = useState('')
  const [jobImage, setJobImage] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [showCashConfirm, setShowCashConfirm] = useState(false)
  const [pendingCashSubmit, setPendingCashSubmit] = useState(null)

  // Fetch booking
  useEffect(() => {
    if (!bookingId) return
    let cancelled = false
    bookingsApi.getBookingStatus(bookingId)
      .then((res) => {
        if (cancelled) return
        const b = res.data?.booking || null
        setBooking(b)
        if (b && b.status === 'COMPLETED') {
          setShowPaymentWaiting(true)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load job')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [bookingId])

  // Socket updates
  useEffect(() => {
    if (!socket || !bookingId) return

    const handleStatusUpdate = (data) => {
      if (data.bookingId === bookingId) {
        setBooking((prev) => prev ? { ...prev, status: data.status, paymentStatus: data.paymentStatus || prev.paymentStatus } : prev)
        if (data.status === 'COMPLETED') {
          setShowPaymentWaiting(true)
        }
      }
    }

    socket.on('BOOKING_STATUS_UPDATE', handleStatusUpdate)
    return () => { socket.off('BOOKING_STATUS_UPDATE', handleStatusUpdate) }
  }, [socket, bookingId])

  const handleStatusUpdate = useCallback(async (nextStatus, requireOtp = false, bypassCashCheck = false) => {
    if (requireOtp && !otp) {
      setUpdateError('OTP is required.')
      return
    }
    if (requireOtp && !jobImage) {
      setUpdateError(nextStatus === 'STARTED' ? 'Before Work image is required.' : 'After Work image is required.')
      return
    }



    setUpdating(true)
    setUpdateError('')
    try {
      let payload = nextStatus
      if (requireOtp) {
        payload = { status: nextStatus, otp }
        if (nextStatus === 'STARTED') payload.beforeImage = jobImage
        if (nextStatus === 'COMPLETED') payload.afterImage = jobImage
      }

      const res = await bookingsApi.updateBookingStatus(bookingId, payload)
      setOtp('')
      setJobImage(null)
      setBooking((prev) => prev ? { ...prev, status: nextStatus } : prev)
      if (nextStatus === 'COMPLETED') {
        setShowPaymentWaiting(true)
      }
    } catch (err) {
      setUpdateError(err instanceof ApiError ? err.message : 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }, [bookingId, navigate, otp, jobImage])

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    setUpdateError('')
    try {
      const uploaded = await uploadMedia(file, UPLOAD_FOLDERS.GENERAL_MEDIA)
      setJobImage(assetUrlFromUpload(uploaded))
    } catch (err) {
      setUpdateError('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  // Track location if EN_ROUTE
  useEffect(() => {
    if (!socket || !booking || booking.status !== 'EN_ROUTE') return

    let watchId
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          socket.emit('LABOUR_LOCATION_UPDATE', {
            bookingId: booking._id,
            customerId: booking.userId?._id || booking.userId,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error('Error tracking location:', error)
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      )
    }

    return () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId)
    }
  }, [socket, booking])

  const handleCancel = useCallback(async () => {
    const confirmed = window.confirm(
      'Are you sure? A ₹50 penalty will be applied to your wallet.'
    )
    if (!confirmed) return

    setUpdating(true)
    setUpdateError('')
    try {
      await bookingsApi.updateBookingStatus(bookingId, 'CANCELLED')
      navigate('/app/my-bookings', { replace: true })
    } catch (err) {
      setUpdateError(err instanceof ApiError ? err.message : 'Failed to cancel')
      setUpdating(false)
    }
  }, [bookingId, navigate])

  if (loading) {
    return (
      <div className="space-y-4">
        <AppStackScreenHeader title="Active Job" backTo="/app" />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="space-y-4">
        <AppStackScreenHeader title="Active Job" backTo="/app" />
        <GlassPanel className="p-6 text-center">
          <p className="text-sm font-semibold text-rose-700">{error || 'Job not found'}</p>
        </GlassPanel>
      </div>
    )
  }

  const status = (booking.status || 'ACCEPTED').toUpperCase()
  const config = STATUS_CONFIG[status]
  const stepIndex = STEP_ORDER.indexOf(status)
  const isCompleted = status === 'COMPLETED'
  const isCancelled = status === 'CANCELLED'
  const customer = booking.userId && typeof booking.userId === 'object' ? booking.userId : null

  // Check if it's too early to start a scheduled job (more than 30 mins away)
  const isTooEarly = booking.type === 'SCHEDULED' && booking.status === 'ACCEPTED' &&
    (new Date(booking.scheduledAt).getTime() - Date.now() > 30 * 60 * 1000)

  return (
    <div className="space-y-4 pb-8">
      <AppStackScreenHeader title="Active Job" backTo="/app" />

      {/* Status Header */}
      <GlassPanel className={`border-brand/20 px-4 py-4 text-center ${isCompleted ? 'bg-blue-50' : isCancelled ? 'bg-rose-50' : 'bg-brand/5'}`}>
        {isCompleted ? (
          <CheckCircle2 className="mx-auto h-12 w-12 text-blue-600" />
        ) : isCancelled ? (
          <X className="mx-auto h-12 w-12 text-rose-500" />
        ) : null}
        <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-500">Status</p>
        <p className="text-xl font-extrabold text-slate-900">{status.replace('_', ' ')}</p>
      </GlassPanel>

      {/* Progress Steps */}
      <GlassPanel className="p-4">
        <div className="flex items-center justify-between">
          {STEP_ORDER.map((step, i) => {
            const done = i <= stepIndex
            return (
              <div key={step} className="flex items-center">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${done ? 'bg-brand text-white' : 'bg-slate-100 text-slate-400'
                    }`}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                {i < STEP_ORDER.length - 1 && (
                  <div className={`mx-1 h-0.5 w-6 sm:w-10 ${i < stepIndex ? 'bg-brand' : 'bg-slate-200'}`} />
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-2 flex justify-between text-[10px] font-bold text-slate-500">
          <span>Accepted</span>
          <span>On Way</span>
          <span>Working</span>
          <span>Done</span>
        </div>
      </GlassPanel>

      {/* Customer Info */}
      {customer && (
        <GlassPanel className="p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm font-extrabold text-slate-900">{customer.name || 'Customer'}</p>
            {customer.phone && (
              <a href={`tel:${customer.phone}`} className="rounded-lg bg-brand/10 px-3 py-1.5 text-xs font-bold text-brand">
                Call
              </a>
            )}
          </div>
        </GlassPanel>
      )}

      {/* Booking Details */}
      <GlassPanel className="p-4 text-sm">
        {booking.totalAmount && (
          <div className="flex justify-between">
            <span className="text-slate-500">Amount</span>
            <span className="font-bold text-slate-900">₹{booking.totalAmount}</span>
          </div>
        )}
        {booking.paymentMethod && (
          <div className="mt-2 flex justify-between">
            <span className="text-slate-500">Payment</span>
            <span className="font-bold text-slate-900">{booking.paymentMethod}</span>
          </div>
        )}
      </GlassPanel>

      {/* Error */}
      {updateError && (
        <motion.p
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          {updateError}
        </motion.p>
      )}

      {/* Action Button */}
      {config && !isCompleted && !isCancelled && (
        <div className="space-y-3">
          {isTooEarly ? (
            <GlassPanel className="p-4 text-center">
              <Clock className="mx-auto h-8 w-8 text-amber-500 mb-2" />
              <p className="text-sm font-bold text-slate-800">Scheduled for later</p>
              <p className="text-xs text-slate-500 mt-1">
                You can start your journey 30 minutes before the scheduled time.
              </p>
            </GlassPanel>
          ) : (
            <>
              {status === 'EN_ROUTE' ? (
                <GlassPanel className="space-y-4 border-brand/20 bg-brand/5 p-4 text-left">
                  <div>
                    <p className="text-sm font-bold text-slate-800 mb-2">1. Upload Before Work Image</p>
                    {jobImage ? (
                      <div className="relative h-40 w-full overflow-hidden rounded-xl border border-slate-200">
                        <img src={jobImage} alt="Before work" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setJobImage(null)}
                          className="absolute right-2 top-2 rounded-full bg-slate-900/50 p-1.5 text-white backdrop-blur-sm"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white/50 text-slate-500 transition hover:border-brand hover:bg-brand/5 hover:text-brand">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                        />
                        {uploadingImage ? (
                          <Loader2 className="h-6 w-6 animate-spin text-brand" />
                        ) : (
                          <>
                            <Camera className="h-6 w-6" />
                            <span className="text-sm font-semibold">Tap to capture</span>
                          </>
                        )}
                      </label>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-800 mb-2">2. Ask customer for Start OTP</p>
                    <input
                      type="text"
                      placeholder="Enter 4-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-3 text-lg font-bold tracking-widest text-center outline-hidden focus:border-brand focus:ring-1 focus:ring-brand"
                      maxLength={4}
                    />
                  </div>

                  <button
                    type="button"
                    disabled={updating || otp.length < 4 || !jobImage || uploadingImage}
                    onClick={() => handleStatusUpdate(config.next, true)}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold text-white shadow-lg transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50 ${config.color}`}
                  >
                    {updating ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Start Job'}
                  </button>
                </GlassPanel>
              ) : status === 'STARTED' ? (
                <GlassPanel className="space-y-4 border-blue-600/20 bg-blue-50 p-4 text-left">
                  <div>
                    <p className="text-sm font-bold text-slate-800 mb-2">1. Upload After Work Image</p>
                    {jobImage ? (
                      <div className="relative h-40 w-full overflow-hidden rounded-xl border border-slate-200">
                        <img src={jobImage} alt="After work" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setJobImage(null)}
                          className="absolute right-2 top-2 rounded-full bg-slate-900/50 p-1.5 text-white backdrop-blur-sm"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white/50 text-slate-500 transition hover:border-blue-600 hover:bg-blue-600/5 hover:text-blue-600">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                        />
                        {uploadingImage ? (
                          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        ) : (
                          <>
                            <Camera className="h-6 w-6" />
                            <span className="text-sm font-semibold">Tap to capture</span>
                          </>
                        )}
                      </label>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-800 mb-2">2. Ask customer for Completion OTP</p>
                    <input
                      type="text"
                      placeholder="Enter 4-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-3 text-lg font-bold tracking-widest text-center outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                      maxLength={4}
                    />
                  </div>

                  <button
                    type="button"
                    disabled={updating || otp.length < 4 || !jobImage || uploadingImage}
                    onClick={() => handleStatusUpdate(config.next, true)}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold text-white shadow-lg transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50 ${config.color}`}
                  >
                    {updating ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Complete Job'}
                  </button>
                </GlassPanel>
              ) : (
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleStatusUpdate(config.next, false)}
                  className={`flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-extrabold text-white shadow-lg transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50 ${config.color}`}
                >
                  {updating ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <config.icon className="h-5 w-5" />
                      {config.label}
                    </>
                  )}
                </button>
              )}

              {status === 'ACCEPTED' && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={handleCancel}
                  className="w-full rounded-2xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-extrabold text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 active:scale-[0.98] disabled:opacity-50"
                >
                  Cancel Booking
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Payment Waiting Modal */}
      {showPaymentWaiting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl text-center"
          >
            {booking?.paymentStatus === 'PAID' ? (
              <>
                <div className="relative mx-auto mb-8 mt-4 flex h-24 w-24 items-center justify-center">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
                    className="relative z-10 flex h-full w-full items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl shadow-blue-500/40"
                  >
                    <CheckCircle2 className="h-12 w-12 text-white" strokeWidth={2.5} />
                  </motion.div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Payment Successfully Received
                </h3>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                  The transaction has been completed successfully and the amount has been credited to your earnings.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentWaiting(false)
                    navigate('/app/earnings', { replace: true })
                  }}
                  className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white transition hover:bg-brand/90 active:scale-95"
                >
                  Collect Money
                </button>
              </>
            ) : (
              <>
                <div className="relative mx-auto mb-8 mt-4 flex h-24 w-24 items-center justify-center">
                  {/* CSS Ripples */}
                  <div className="absolute inset-0 rounded-full bg-blue-400 opacity-75 animate-ping" style={{ animationDuration: '2s' }} />
                  <div className="absolute inset-0 rounded-full bg-indigo-400 opacity-50 animate-ping" style={{ animationDuration: '2s', animationDelay: '1s' }} />
                  
                  {/* Center Glowing Icon */}
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    className="relative z-10 flex h-full w-full items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl shadow-blue-500/40"
                  >
                    <Wallet className="h-10 w-10 text-white" strokeWidth={2} />
                  </motion.div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Waiting for Customer Payment
                </h3>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                  Please hold on while the customer completes the transaction...
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentWaiting(false)
                    navigate('/app/my-bookings', { replace: true })
                  }}
                  className="w-full rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200 active:scale-95"
                >
                  Return to Bookings
                </button>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}
