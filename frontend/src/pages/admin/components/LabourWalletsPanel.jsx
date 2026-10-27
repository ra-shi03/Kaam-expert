import { useCallback, useEffect, useState } from 'react'
import { FileText, Search } from 'lucide-react'
import { GlassPanel } from '../../../components/ui/GlassPanel.jsx'
import { adminWalletsApi } from '../../../api/adminWalletsApi.js'
import { ApiError } from '../../../api/http.js'
import { formatRupees } from '../../../lib/walletLabels.js'
import { LabourWalletStatementModal } from './LabourWalletStatementModal.jsx'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'dues', label: 'Owe us money' },
  { id: 'low', label: 'Wallet too low' },
  { id: 'recharged', label: 'Added money' },
]

/** Every labourer's wallet: balance, recharge credit, dues — with their statement */
export function LabourWalletsPanel() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statementFor, setStatementFor] = useState(null)

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 350)
    return () => window.clearTimeout(t)
  }, [searchInput])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await adminWalletsApi.getLabourWallets({ search, filter, page, limit: 15 })
      setData(res.data)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load labour wallets')
    } finally {
      setLoading(false)
    }
  }, [search, filter, page])

  useEffect(() => {
    load()
  }, [load])

  const stats = data?.stats
  const items = data?.items ?? []

  return (
    <GlassPanel className="overflow-hidden p-0">
      <div className="space-y-4 border-b border-slate-100 bg-white p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Labour Wallets</h2>
            <p className="text-sm text-slate-500">Wallet money of every labourer, the fees taken for cash bookings and any money they owe us</p>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto rounded-lg bg-slate-100 p-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFilter(f.id)
                  setPage(1)
                }}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-bold transition-all ${filter === f.id ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {stats ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ['Money added by labourers', formatRupees(stats.rechargeHeld)],
              ['Total owed to us', formatRupees(stats.outstandingDues)],
              ['Labourers who owe us', stats.inDues],
              ['Not shown cash bookings', stats.cannotTakeCash],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
                <p className="mt-1 text-lg font-extrabold tabular-nums text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search labour by name or mobile…"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setPage(1)
            }}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/50"
          />
        </div>
      </div>

      {error ? <p className="px-6 py-4 text-sm font-medium text-rose-700">{error}</p> : null}

      {loading && !data ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center font-medium text-slate-500">No labour wallets found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 text-sm text-slate-500">
                <th className="px-4 py-3 font-semibold">Labour</th>
                <th className="px-4 py-3 text-right font-semibold">Wallet balance</th>
                <th className="px-4 py-3 text-right font-semibold">Can withdraw</th>
                <th className="px-4 py-3 text-right font-semibold">Added money</th>
                <th className="px-4 py-3 text-right font-semibold">Owes us</th>
                <th className="px-4 py-3 text-right font-semibold">Cash jobs</th>
                <th className="px-4 py-3 text-right font-semibold">Cash received</th>
                <th className="px-4 py-3 text-right font-semibold">Fees taken</th>
                <th className="px-4 py-3 text-center font-semibold" title="Receiving: gets cash bookings · Add money: wallet too low for cash bookings · Stopped: owes the maximum allowed, gets no bookings">Cash bookings</th>
                <th className="px-4 py-3 text-right font-semibold">Statement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((u) => {
                const s = u.summary
                const blocked = s.outstandingDues > 0 && s.outstandingDues >= (data.labourCashLimit ?? Infinity)
                const canTakeCash = !data.cashRuleEnabled || s.balance > (data.minBalance ?? 0)
                const c = u.cash || {}
                return (
                  <tr key={u._id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-slate-900">{u.fullName || '—'}</p>
                      <p className="font-mono text-xs text-slate-500">+91 {u.phone}</p>
                    </td>
                    <td className={`px-4 py-3 text-right font-mono font-black ${s.balance < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                      {formatRupees(s.balance)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-emerald-700">{formatRupees(s.withdrawable)}</td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-slate-700">{formatRupees(s.rechargeBalance)}</td>
                    <td className={`px-4 py-3 text-right font-mono text-sm ${s.outstandingDues > 0 ? 'font-bold text-rose-600' : 'text-slate-400'}`}>
                      {formatRupees(s.outstandingDues)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-700">
                      {c.jobs ?? 0}
                      {c.pendingJobs ? <span className="block text-[11px] text-amber-600">{c.pendingJobs} not paid yet</span> : null}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-slate-700">{formatRupees(c.collected ?? 0)}</td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-slate-700">{formatRupees(c.feesCharged ?? 0)}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${blocked ? 'bg-rose-100 text-rose-700' : !canTakeCash ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}
                      >
                        {blocked ? 'STOPPED' : !canTakeCash ? 'ADD MONEY' : 'RECEIVING'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setStatementFor(u._id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-brand/10 hover:text-brand"
                      >
                        <FileText className="size-3.5" /> View
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {(data?.pages ?? 1) > 1 ? (
        <div className="flex items-center justify-center gap-2 border-t border-slate-100 py-4">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm font-medium text-slate-600">
            Page {page} of {data.pages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
            disabled={page === data.pages || loading}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
          >
            Next
          </button>
        </div>
      ) : null}

      {statementFor ? <LabourWalletStatementModal userId={statementFor} onClose={() => setStatementFor(null)} /> : null}
    </GlassPanel>
  )
}
