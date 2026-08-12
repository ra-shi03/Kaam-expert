import { useState, useEffect, useCallback } from 'react'
import { Clock, Loader2, CheckCircle, Search, Filter, AlertCircle, Calendar } from 'lucide-react'
import { GlassPanel } from '../../components/ui/GlassPanel.jsx'
import { AppPrimaryButton } from '../../components/app/AppPrimaryButton.jsx'
import { apiRequest } from '../../api/http.js'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function AdminAttendancePage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [verifyingId, setVerifyingId] = useState(null)
  
  // Filters
  const [filterDate, setFilterDate] = useState('')
  const [filterStatus, setFilterStatus] = useState('pending') // 'all', 'pending', 'verified'

  const loadAttendance = useCallback(async () => {
    try {
      setLoading(true)
      let url = '/workforce/attendance'
      if (filterDate) {
        url += `?date=${filterDate}`
      }
      const res = await apiRequest(url)
      let data = res.data?.records || []
      
      // Client-side status filtering (since backend doesn't have a direct verified flag query)
      if (filterStatus === 'pending') {
        data = data.filter(r => !r.verifiedAt)
      } else if (filterStatus === 'verified') {
        data = data.filter(r => !!r.verifiedAt)
      }
      
      setRecords(data)
      setError('')
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Could not load attendance.')
    } finally {
      setLoading(false)
    }
  }, [filterDate, filterStatus])

  useEffect(() => {
    loadAttendance()
  }, [loadAttendance])

  const handleVerify = async (id, status = 'present') => {
    setVerifyingId(id)
    try {
      await apiRequest(`/admin/workforce/attendance/${id}/verify`, {
        method: 'PATCH',
        body: { status }
      })
      // Update local state to reflect verification
      setRecords(prev => prev.map(r => r._id === id ? { ...r, verifiedAt: new Date().toISOString(), status, verifiedBy: 'admin' } : r))
    } catch (err) {
      console.error('Verification failed', err)
    } finally {
      setVerifyingId(null)
      // If we are filtering by pending, we might want to reload to remove it from view
      if (filterStatus === 'pending') {
         loadAttendance()
      }
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Attendance</h1>
          <p className="mt-2 text-sm text-slate-600">All workforce check-ins — verify for billing.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filterStatus === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filterStatus === 'pending' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Pending
            </button>
            <button 
              onClick={() => setFilterStatus('verified')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filterStatus === 'verified' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Verified
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <GlassPanel className="flex flex-col items-center justify-center p-12 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-brand mb-3" />
          <p className="text-sm">Loading attendance records...</p>
        </GlassPanel>
      ) : error ? (
        <GlassPanel className="p-6 text-rose-800 flex items-center gap-2 bg-rose-50 border-rose-100">
          <AlertCircle className="w-5 h-5" />
          {error}
        </GlassPanel>
      ) : records.length === 0 ? (
        <GlassPanel className="flex flex-col items-center justify-center p-12 text-slate-400">
          <Clock className="w-10 h-10 mb-3 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">No records found</p>
          <p className="text-xs mt-1">Try changing the date or status filter.</p>
        </GlassPanel>
      ) : (
        <ul className="space-y-3">
          {records.map((r) => (
            <li key={r._id}>
              <GlassPanel className="flex flex-wrap items-center justify-between gap-4 p-5 hover:border-brand/30 transition-colors">
                <div className="flex items-start gap-4">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 ${r.verifiedAt ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                    <Clock className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold text-slate-900">{r.labourId?.fullName || 'Unknown Worker'}</p>
                      {r.labourId?.phone && (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium tracking-wide">
                          {r.labourId.phone}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(r.shiftDate)}
                      </span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span className="capitalize font-medium text-slate-700">{r.status}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span>Verified: {r.verifiedBy || '—'}</span>
                    </div>
                    
                    {r.checkInAt && (
                      <p className="text-xs text-slate-400 mt-1.5">
                        In: {new Date(r.checkInAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        {r.checkOutAt && ` - Out: ${new Date(r.checkOutAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  {r.billableUnits != null && r.billableUnits > 0 ? (
                    <span className="text-xs font-semibold bg-brand/10 text-brand px-2 py-1 rounded-md">
                      Billable: {r.billableUnits} units
                    </span>
                  ) : null}
                  
                  {!r.verifiedAt ? (
                    <div className="flex items-center gap-2 mt-2 md:mt-0">
                      <button
                        type="button"
                        onClick={() => handleVerify(r._id, 'absent')}
                        disabled={verifyingId === r._id}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Absent
                      </button>
                      <AppPrimaryButton 
                        type="button" 
                        loading={verifyingId === r._id} 
                        onClick={() => handleVerify(r._id, 'present')}
                        className="px-4 py-1.5 text-xs"
                      >
                        Verify Present
                      </AppPrimaryButton>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">
                      <CheckCircle className="w-4 h-4" />
                      Verified
                    </div>
                  )}
                </div>
              </GlassPanel>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
