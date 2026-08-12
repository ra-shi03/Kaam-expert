import { useEffect, useState } from 'react'
import { Plus, Eye, Edit, Trash2, Shield, Users } from 'lucide-react'
import { GlassPanel } from '../../components/ui/GlassPanel.jsx'
import { adminSubscriptionsApi } from '../../api/adminSubscriptionsApi.js'
import { AdminSubscriptionPlanModal } from './components/AdminSubscriptionPlanModal.jsx'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

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

export function AdminMartSubscriptionsPage() {
  const [activeTab, setActiveTab] = useState('plans') // 'plans' or 'vendors'
  const [plans, setPlans] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create', 'view', 'edit'
  const [selectedPlan, setSelectedPlan] = useState(null)
  
  // Delete confirm state
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  
  const [toast, setToast] = useState({ message: '', variant: 'success' })

  const showToast = (message, variant = 'success') => {
    setToast({ message, variant })
    setTimeout(() => setToast({ message: '', variant: 'success' }), 3000)
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      if (activeTab === 'plans') {
        const res = await adminSubscriptionsApi.getPlans()
        setPlans(res?.plans || [])
      } else {
        const res = await adminSubscriptionsApi.getVendorSubscriptions()
        setSubscriptions(res?.subscriptions || [])
      }
    } catch (err) {
      console.error('Failed to fetch data', err)
      showToast('Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const handleSavePlan = async (planData) => {
    try {
      if (modalMode === 'edit' && selectedPlan) {
        await adminSubscriptionsApi.updatePlan(selectedPlan._id, planData)
        showToast('Subscription plan updated successfully', 'success')
      } else {
        await adminSubscriptionsApi.createPlan(planData)
        showToast('Subscription plan created successfully', 'success')
      }
      fetchData()
    } catch (err) {
      console.error('Failed to save plan', err)
      showToast('Failed to save subscription plan', 'error')
    }
  }

  const handleDeletePlan = async (id) => {
    try {
      await adminSubscriptionsApi.deletePlan(id)
      showToast('Subscription plan deleted successfully', 'success')
      setDeleteConfirm(null)
      fetchData()
    } catch (err) {
      console.error('Failed to delete plan', err)
      showToast('Failed to delete subscription plan', 'error')
    }
  }

  const openCreateModal = () => {
    setModalMode('create')
    setSelectedPlan(null)
    setIsModalOpen(true)
  }

  const openViewModal = async (plan) => {
    try {
      const res = await adminSubscriptionsApi.getPlanById(plan._id)
      setModalMode('view')
      setSelectedPlan(res?.plan || plan)
      setIsModalOpen(true)
    } catch (err) {
      console.error('Failed to fetch plan details', err)
      showToast('Failed to load plan details', 'error')
    }
  }

  const openEditModal = async (plan) => {
    try {
      const res = await adminSubscriptionsApi.getPlanById(plan._id)
      setModalMode('edit')
      setSelectedPlan(res?.plan || plan)
      setIsModalOpen(true)
    } catch (err) {
      console.error('Failed to fetch plan details', err)
      showToast('Failed to load plan details', 'error')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-7xl space-y-6"
    >
      <AnimatePresence>
        {toast.message && <Toast message={toast.message} variant={toast.variant} />}
      </AnimatePresence>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Mart Subscriptions</h2>
          <p className="text-sm text-slate-500">Manage vendor app mart subscription plans and view subscribers</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex w-max items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand/90 hover:shadow-brand/30"
        >
          <Plus className="h-4 w-4" /> Add Pricing
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 rounded-xl bg-slate-100 p-1">
        <button
          onClick={() => setActiveTab('plans')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition ${
            activeTab === 'plans' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Shield className="h-4 w-4" /> Subscription Plans
        </button>
        <button
          onClick={() => setActiveTab('vendors')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition ${
            activeTab === 'vendors' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="h-4 w-4" /> Vendor Subscriptions
        </button>
      </div>

      <GlassPanel className="p-0">
        <div className="overflow-x-auto">
          {activeTab === 'plans' ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-bold">Plan Name</th>
                  <th className="px-6 py-4 font-bold">Price</th>
                  <th className="px-6 py-4 font-bold">Duration</th>
                  <th className="px-6 py-4 font-bold">Popular</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center font-medium text-slate-400">
                      <div className="flex items-center justify-center gap-3">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                        Loading plans...
                      </div>
                    </td>
                  </tr>
                ) : plans.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center font-medium text-slate-400">
                      No subscription plans found.
                    </td>
                  </tr>
                ) : (
                  plans.map(plan => (
                    <tr key={plan._id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {plan.name}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-600">
                        ₹{plan.price}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {plan.duration}
                      </td>
                      <td className="px-6 py-4">
                        {plan.recommended ? (
                          <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-800">
                            YES
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                            NO
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openViewModal(plan)} className="p-2 text-slate-400 hover:text-brand transition rounded-full hover:bg-brand/10">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => openEditModal(plan)} className="p-2 text-slate-400 hover:text-indigo-600 transition rounded-full hover:bg-indigo-50">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeleteConfirm(plan)} className="p-2 text-slate-400 hover:text-red-600 transition rounded-full hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-bold">Vendor Name</th>
                  <th className="px-6 py-4 font-bold">Business Name</th>
                  <th className="px-6 py-4 font-bold">Phone</th>
                  <th className="px-6 py-4 font-bold">Plan</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Subscribed On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center font-medium text-slate-400">
                      <div className="flex items-center justify-center gap-3">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                        Loading subscriptions...
                      </div>
                    </td>
                  </tr>
                ) : subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center font-medium text-slate-400">
                      No vendor subscriptions found.
                    </td>
                  </tr>
                ) : (
                  subscriptions.map(sub => (
                    <tr key={sub._id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {sub.vendor?.fullName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {sub.vendor?.contractorProfile?.businessName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {sub.vendor?.phone || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{sub.plan?.name || 'Unknown Plan'}</div>
                        <div className="text-xs text-slate-500">₹{sub.plan?.price || 0} {sub.plan?.duration || ''}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          sub.status === 'active' ? 'bg-blue-100 text-blue-800' : 
                          sub.status === 'expired' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {sub.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">
                        {new Date(sub.startDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </GlassPanel>

      <AdminSubscriptionPlanModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePlan}
        mode={modalMode}
        initialData={selectedPlan}
      />

      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <div className="p-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <Trash2 className="h-6 w-6" />
                </div>
                <h3 className="text-center text-lg font-bold text-slate-900">Delete Plan?</h3>
                <p className="mt-2 text-center text-sm text-slate-500">
                  Are you sure you want to delete the plan <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeletePlan(deleteConfirm._id)}
                    className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
