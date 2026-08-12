import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Shield, Loader2, AlertTriangle, Clock } from 'lucide-react'
import { userSubscriptionApi } from '../../api/userSubscriptionApi'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'

function Toast({ message, variant = 'success' }) {
  if (!message) return null
  const styles = variant === 'error'
    ? 'border-rose-200 bg-rose-50 text-rose-900'
    : 'border-blue-200 bg-blue-50 text-blue-900'
  const Icon = variant === 'error' ? AlertTriangle : CheckCircle2
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`fixed left-4 right-4 top-20 z-50 mx-auto flex max-w-lg items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${styles}`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {message}
    </motion.div>
  )
}

export function AppSubscriptionPage() {
  const [activeSubscription, setActiveSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [toast, setToast] = useState({ message: '', variant: 'success' })
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector((s) => s.auth.user)
  const [settingsPrice, setSettingsPrice] = useState(19)

  const trialEndsAt = user?.labourProfile?.trialEndsAt
  const trialActive = trialEndsAt ? new Date(trialEndsAt) > new Date() : false

  const showToast = (message, variant = 'success') => {
    setToast({ message, variant })
    setTimeout(() => setToast({ message: '', variant: 'success' }), 4000)
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const subRes = await userSubscriptionApi.getMySubscription()
      setActiveSubscription(subRes?.data?.subscription || null)
    } catch (err) {
      console.error(err)
      showToast('Failed to load subscriptions', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handleSubscribe = async () => {
    try {
      setProcessing(true)
      
      const res = await loadRazorpay()
      if (!res) {
        showToast('Razorpay SDK failed to load. Are you online?', 'error')
        setProcessing(false)
        return
      }

      const orderRes = await userSubscriptionApi.createOrder()
      const { order, keyId, price } = orderRes.data
      setSettingsPrice(price)

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'KaamExpert',
        description: `Daily Subscription (₹${price})`,
        order_id: order.id,
        handler: async function (response) {
          try {
            await userSubscriptionApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            showToast('Subscription activated successfully!', 'success')
            loadData()
          } catch (err) {
            showToast('Payment verification failed', 'error')
          }
        },
        prefill: {
          name: user?.fullName || '',
          contact: user?.phone || '',
          email: user?.email || ''
        },
        theme: {
          color: '#f97316'
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function (response) {
        showToast(response.error.description || 'Payment failed', 'error')
      })
      rzp.open()

    } catch (err) {
      console.error(err)
      showToast(err?.response?.data?.message || 'Failed to initiate checkout', 'error')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
  }

  const isSubscribedToday = activeSubscription?.status === 'active'

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-4">
      <AnimatePresence>
        {toast.message && <Toast message={toast.message} variant={toast.variant} />}
      </AnimatePresence>
      <div className="mx-auto max-w-lg px-4 sm:px-6">
        <div className="mb-8 text-center">
          <Shield className="mx-auto mb-4 h-12 w-12 text-brand" />
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Platform Access</h1>
          <p className="mx-auto mt-3 max-w-md text-slate-600 sm:text-lg">
            Get exclusive access to daily jobs by subscribing or using your free trial.
          </p>
        </div>

        {trialActive ? (
          <div className="mb-6 overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/50 border border-emerald-100">
            <div className="bg-emerald-500 px-6 py-4">
              <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                <Clock className="h-5 w-5" /> Free Trial Active
              </h2>
            </div>
            <div className="p-6">
              <p className="text-slate-600">You are currently on your free trial. You can receive unlimited job offers until your trial ends.</p>
              <div className="mt-4 rounded-xl bg-emerald-50 p-4 border border-emerald-100">
                <p className="text-sm font-semibold text-emerald-800">
                  Trial ends on: <span className="font-bold">{new Date(trialEndsAt).toLocaleDateString()} at {new Date(trialEndsAt).toLocaleTimeString()}</span>
                </p>
              </div>
            </div>
          </div>
        ) : isSubscribedToday ? (
          <div className="mb-6 overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/50 border border-brand/20">
            <div className="bg-brand px-6 py-4">
              <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                <CheckCircle2 className="h-5 w-5" /> Active Today
              </h2>
            </div>
            <div className="p-6">
              <p className="text-slate-600">You have paid the daily subscription fee. You can receive unlimited job offers today.</p>
              <div className="mt-4 rounded-xl bg-brand/10 p-4 border border-brand/20">
                <p className="text-sm font-semibold text-brand">
                  Opportunities received today: <span className="font-bold text-lg">{activeSubscription.bookingsReceived || 0}</span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/50">
            <div className="p-6 sm:p-8 text-center">
              <h2 className="text-2xl font-black text-slate-900">Daily Access</h2>
              <div className="mt-4 flex items-baseline justify-center gap-1">
                <span className="text-5xl font-black text-brand">₹{settingsPrice}</span>
                <span className="text-xl font-bold text-slate-500">/day</span>
              </div>
              <p className="mt-4 text-slate-600 text-sm">
                Pay the daily fee to start receiving job offers. You'll only pay on the days you want to work!
              </p>
              
              <ul className="mt-6 space-y-3 text-left">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span className="text-sm font-medium text-slate-700">Unlimited job offers for today</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span className="text-sm font-medium text-slate-700">Receive 100% of your earnings</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span className="text-sm font-medium text-slate-700">Only pay when you log in to work</span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <span className="text-sm font-medium text-slate-700">Fee is non-refundable if you receive 2+ offers today.</span>
                </li>
              </ul>

              <button
                onClick={handleSubscribe}
                disabled={processing}
                className="group mt-8 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold bg-brand text-white shadow-lg shadow-brand/30 transition hover:bg-brand-bright disabled:opacity-70"
              >
                {processing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Pay Now to Start Earning'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
