import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, X } from 'lucide-react'
import { adminWalletsApi } from '../../../api/adminWalletsApi.js'
import { ApiError } from '../../../api/http.js'
import { WALLET_CONTEXT_LABELS, formatRupees } from '../../../lib/walletLabels.js'

function formatDate(d) {
  return new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

/** Admin view of one labourer's wallet ledger (recharges, cash-job fees, payouts, bonuses…) */
export function LabourWalletStatementModal({ userId, onClose }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    let cancelled = false
    adminWalletsApi
      .getLabourWalletTransactions(userId, { page: 1, limit: 20 })
      .then((res) => {
        if (!cancelled) setData(res.data)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof ApiError ? e.message : 'Could not load statement')
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  async function loadMore() {
    setLoadingMore(true)
    try {
      const res = await adminWalletsApi.getLabourWalletTransactions(userId, { page: data.page + 1, limit: 20 })
      setData((prev) => ({ ...res.data, items: [...prev.items, ...(res.data?.items || [])] }))
    } catch {
      // keep current rows
    } finally {
      setLoadingMore(false)
    }
  }

  const s = data?.summary

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" aria-label="Close" onClick={onClose} />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="statement-title"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 id="statement-title" className="truncate text-base font-extrabold text-slate-900">
              {data?.labour?.fullName || 'Wallet statement'}
            </h2>
            {data?.labour?.phone ? <p className="font-mono text-xs text-slate-500">+91 {data.labour.phone}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}
          {!data && !error ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
            </div>
          ) : null}
          {s ? (
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ['Wallet balance', s.balance, s.balance < 0 ? 'text-rose-700' : 'text-slate-900'],
                ['Can withdraw', s.withdrawable, 'text-emerald-700'],
                ['Added money', s.rechargeBalance, 'text-slate-900'],
                ['Owes us', s.outstandingDues, s.outstandingDues > 0 ? 'text-rose-700' : 'text-slate-900'],
              ].map(([label, value, cls]) => (
                <div key={label} className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200/80">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
                  <p className={`font-mono text-sm font-black ${cls}`}>{formatRupees(value)}</p>
                </div>
              ))}
            </div>
          ) : null}
          {data && data.items.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">No wallet activity yet.</p> : null}
          {data && data.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3 text-right">Amount</th>
                    <th className="py-2 text-right">Balance after</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((t) => (
                    <tr key={t._id}>
                      <td className="py-2 pr-3 text-xs text-slate-600">{formatDate(t.createdAt)}</td>
                      <td className="py-2 pr-3">
                        <p className="text-xs font-semibold text-slate-900">{WALLET_CONTEXT_LABELS[t.context] || t.context}</p>
                        {t.description ? <p className="max-w-[240px] truncate text-[11px] text-slate-500" title={t.description}>{t.description}</p> : null}
                      </td>
                      <td className={`py-2 pr-3 text-right font-mono text-xs font-bold ${t.type === 'CREDIT' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {t.type === 'CREDIT' ? '+' : '−'}
                        {formatRupees(t.amount)}
                      </td>
                      <td className="py-2 text-right font-mono text-xs text-slate-600">
                        {typeof t.balanceAfter === 'number' ? formatRupees(t.balanceAfter) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {data && data.page < data.pages ? (
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="mt-3 w-full rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          ) : null}
        </div>
      </motion.div>
    </div>
  )
}
