import { useState, useEffect, useCallback } from 'react'
import {
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  IndianRupee,
  Clock,
  XCircle,
  CheckSquare,
  FilePlus,
  ChevronDown,
} from 'lucide-react'
import { GlassPanel } from '../../components/ui/GlassPanel.jsx'
import { AppPrimaryButton } from '../../components/app/AppPrimaryButton.jsx'
import { apiRequest } from '../../api/http.js'

const INVOICE_STATUSES = ['draft', 'issued', 'paid', 'overdue', 'cancelled']

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-600', icon: FileText },
  issued: { label: 'Issued', color: 'bg-blue-100 text-blue-700', icon: Clock },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-400', icon: XCircle },
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/30 transition-all'

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      {status}
    </span>
  )
}

export function AdminBillingPage() {
  const [invoices, setInvoices] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const limit = 15

  // Generate invoice form
  const [requestId, setRequestId] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genMsg, setGenMsg] = useState({ type: '', text: '' })

  // Patch status
  const [patchingId, setPatchingId] = useState(null)

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page, limit })
      if (statusFilter) params.set('status', statusFilter)
      const res = await apiRequest(`/admin/workforce/invoices?${params}`)
      setInvoices(res.data?.invoices ?? [])
      setTotal(res.data?.total ?? 0)
    } catch {
      // silent — show empty state
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page])

  useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

  const showGenMsg = (type, text) => {
    setGenMsg({ type, text })
    setTimeout(() => setGenMsg({ type: '', text: '' }), 6000)
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!requestId.trim()) return
    setGenerating(true)
    try {
      const res = await apiRequest('/admin/workforce/invoices/generate', {
        method: 'POST',
        body: { requestId: requestId.trim() },
      })
      showGenMsg('success', `Invoice ${res.data?.invoice?.invoiceNumber || ''} generated successfully!`)
      setRequestId('')
      loadInvoices()
    } catch (err) {
      showGenMsg('error', err?.data?.message || err?.message || 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const handlePatchStatus = async (id, status) => {
    setPatchingId(id)
    try {
      await apiRequest(`/admin/workforce/invoices/${id}`, {
        method: 'PATCH',
        body: { status },
      })
      loadInvoices()
    } catch {
      // silent
    } finally {
      setPatchingId(null)
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payments & Billing</h1>
        <p className="text-gray-500 mt-1">Generate GST-ready invoices from verified attendance and manage payment status</p>
      </div>

      {/* Summary Counts */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {INVOICE_STATUSES.map((s) => {
          const cfg = STATUS_CONFIG[s]
          const count = invoices.filter((i) => i.status === s).length
          return (
            <button
              key={s}
              onClick={() => { setStatusFilter(statusFilter === s ? '' : s); setPage(1) }}
              className={`p-4 rounded-2xl border text-left transition-all ${
                statusFilter === s
                  ? 'border-brand bg-brand/5'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <p className="text-xs text-gray-400 capitalize mb-1">{s}</p>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
            </button>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Generate Invoice Form */}
        <GlassPanel className="p-6 lg:col-span-1 h-fit">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <FilePlus className="w-5 h-5 text-brand" />
            Generate Invoice
          </h2>

          {genMsg.text && (
            <div
              className={`p-3 rounded-lg mb-5 text-sm flex items-start gap-2 ${
                genMsg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
              }`}
            >
              {genMsg.type === 'success' ? (
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              )}
              {genMsg.text}
            </div>
          )}

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Workforce Request ID</label>
              <input
                className={inputClass}
                value={requestId}
                onChange={(e) => setRequestId(e.target.value)}
                placeholder="MongoDB _id of the request"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                The request must have verified attendance records to generate an invoice.
              </p>
            </div>
            <AppPrimaryButton type="submit" disabled={generating} className="w-full justify-center">
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating…
                </>
              ) : (
                'Generate Invoice'
              )}
            </AppPrimaryButton>
          </form>
        </GlassPanel>

        {/* Invoices Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-brand" />
                Invoices
                {statusFilter && (
                  <span className="text-sm font-normal text-gray-400">
                    — filtered by <span className="font-medium capitalize">{statusFilter}</span>
                    <button onClick={() => { setStatusFilter(''); setPage(1) }} className="ml-1 text-brand hover:underline">clear</button>
                  </span>
                )}
              </h2>
            </div>
            <button
              onClick={loadInvoices}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Status filter tabs */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => { setStatusFilter(''); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                !statusFilter ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({total})
            </button>
            {INVOICE_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  statusFilter === s ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <GlassPanel className="overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-brand" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <FileText className="w-10 h-10 mb-2" />
                <p className="text-sm">No invoices found.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Invoice #</th>
                    <th className="text-left px-4 py-3.5 font-semibold text-gray-600">Client</th>
                    <th className="text-right px-4 py-3.5 font-semibold text-gray-600">Total</th>
                    <th className="text-left px-4 py-3.5 font-semibold text-gray-600">Status</th>
                    <th className="text-left px-4 py-3.5 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-5 py-3.5">
                        <p className="font-mono font-medium text-gray-800">{inv.invoiceNumber || '—'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(inv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-gray-700">{inv.contractorId?.fullName || 'Individual'}</p>
                        <p className="text-xs text-gray-400">{inv.contractorId?.email || ''}</p>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <p className="font-semibold text-gray-900">₹{(inv.total || 0).toLocaleString('en-IN')}</p>
                        <p className="text-xs text-gray-400">+₹{(inv.gstTotal || 0).toLocaleString('en-IN')} GST</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        {patchingId === inv._id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
                        ) : (
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {inv.status !== 'paid' && (
                              <button
                                onClick={() => handlePatchStatus(inv._id, 'paid')}
                                title="Mark as Paid"
                                className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                              >
                                <CheckSquare className="w-4 h-4" />
                              </button>
                            )}
                            {inv.status !== 'overdue' && inv.status !== 'paid' && (
                              <button
                                onClick={() => handlePatchStatus(inv._id, 'overdue')}
                                title="Mark as Overdue"
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Clock className="w-4 h-4" />
                              </button>
                            )}
                            {inv.status !== 'cancelled' && inv.status !== 'paid' && (
                              <button
                                onClick={() => handlePatchStatus(inv._id, 'cancelled')}
                                title="Cancel"
                                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </GlassPanel>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Page {page} of {totalPages} ({total} total)</span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
