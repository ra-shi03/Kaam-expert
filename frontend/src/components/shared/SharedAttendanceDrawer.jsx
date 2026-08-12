import React from 'react'
import { XCircle, Clock, CheckCircle2, User, UserX } from 'lucide-react'
import { useGetAttendanceQuery } from '../../store/api/workforceApi.js'

export function SharedAttendanceDrawer({ requestId, onClose }) {
  const { data, isLoading } = useGetAttendanceQuery(
    requestId ? { requestId } : undefined,
    { skip: !requestId }
  )

  const attendanceRecords = data?.records || []

  // Group attendance by date
  const groupedByDate = attendanceRecords.reduce((acc, record) => {
    const date = new Date(record.date).toLocaleDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(record)
    return acc
  }, {})

  return (
    <>
      {/* Backdrop */}
      {requestId && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm transition-opacity" 
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ease-in-out ${requestId ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50">
            <div>
              <h2 className="text-lg font-black text-slate-900">Attendance Log</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1 uppercase tracking-wider">Crew Check-ins</p>
            </div>
            <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition">
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Clock className="h-8 w-8 animate-spin mb-3 text-brand" />
                <p className="text-sm font-semibold">Loading attendance...</p>
              </div>
            ) : attendanceRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center">
                <UserX className="h-12 w-12 mb-3 text-slate-300" />
                <p className="text-sm font-bold text-slate-700">No Attendance Records</p>
                <p className="text-xs text-slate-500 mt-1">Workers have not checked in for this request yet.</p>
              </div>
            ) : (
              Object.entries(groupedByDate).map(([date, records]) => (
                <div key={date} className="mb-6">
                  <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                    <Clock className="w-4 h-4 text-brand" />
                    <h3 className="text-sm font-bold text-slate-800">{date}</h3>
                  </div>
                  <div className="space-y-3">
                    {records.map(record => (
                      <div key={record._id} className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-3 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="bg-slate-100 p-2 rounded-full">
                            <User className="w-4 h-4 text-slate-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{record.labourId?.fullName || 'Worker'}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              {record.status === 'present' ? (
                                <><CheckCircle2 className="w-3 h-3 text-blue-600" /> Present</>
                              ) : (
                                <span className="text-rose-500 uppercase font-bold text-[10px]">{record.status}</span>
                              )}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-y-3 gap-x-2 border-t border-slate-50 pt-3">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Vendor Dispatch</span>
                            <span className="text-xs font-semibold text-slate-700 mt-0.5">
                              {record.vendorCheckInAt ? new Date(record.vendorCheckInAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}
                            </span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Client Check-In</span>
                            <span className="text-xs font-semibold text-brand mt-0.5">
                              {record.clientCheckInAt ? new Date(record.clientCheckInAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Client Check-Out</span>
                            <span className="text-xs font-semibold text-brand mt-0.5">
                              {record.clientCheckOutAt ? new Date(record.clientCheckOutAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}
                            </span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Vendor Check-Out</span>
                            <span className="text-xs font-semibold text-slate-700 mt-0.5">
                              {record.vendorCheckOutAt ? new Date(record.vendorCheckOutAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}
