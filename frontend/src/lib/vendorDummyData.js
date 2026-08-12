/** Dummy vendor panel data — SOW: supply workforce, admin allocations, attendance billing. */

const now = Date.now()
const day = (offset) => new Date(now + offset * 86400000).toISOString()

export const VENDOR_DUMMY_STATS = {
  crewCount: 48,
  openJobs: 3,
  activeAssignments: 2,
  pendingAccept: 1,
  attendanceToday: 41,
  presentToday: 38,
  absentToday: 3,
  earningsMonth: 428500,
  pendingPayout: 86500,
  availableBalance: 142200,
  invoicesDue: 2,
  sitesActive: 2,
}

export const VENDOR_DUMMY_CREW = [
  {
    _id: 'crew-1',
    fullName: 'Ramesh Kumar',
    phone: '9876543210',
    skills: ['Mason', 'Helper'],
    kycStatus: 'approved',
    availability: 'available',
    activeSite: 'L&T Sector 78',
  },
  {
    _id: 'crew-2',
    fullName: 'Suresh Yadav',
    phone: '9123456780',
    skills: ['Electrician'],
    kycStatus: 'approved',
    availability: 'on_site',
    activeSite: 'M3M Golf Course Ext.',
  },
  {
    _id: 'crew-3',
    fullName: 'Anil Singh',
    phone: '9988776655',
    skills: ['Plumber', 'Helper'],
    kycStatus: 'pending',
    availability: 'available',
    activeSite: null,
  },
  {
    _id: 'crew-4',
    fullName: 'Vikram Patel',
    phone: '9012345678',
    skills: ['Painter'],
    kycStatus: 'approved',
    availability: 'on_site',
    activeSite: 'L&T Sector 78',
  },
  {
    _id: 'crew-5',
    fullName: 'Mohit Sharma',
    phone: '8877665544',
    skills: ['Carpenter', 'Helper'],
    kycStatus: 'approved',
    availability: 'leave',
    activeSite: null,
  },
]

export const VENDOR_DUMMY_ALLOCATIONS = [
  {
    _id: 'alloc-1',
    vendorAcceptedAt: null,
    deployedAt: null,
    notes: 'Deploy 25 masons + 10 helpers. FCFS — confirm crew list within 24h.',
    workersRequired: 35,
    workersAssigned: 0,
    requestId: {
      _id: 'req-1',
      reference: 'WF-2026-0142',
      status: 'allocating',
      locationText: 'L&T Construction, Sector 78, Gurugram',
      startDate: day(2),
      endDate: day(62),
      clientName: 'L&T Construction',
      lines: [
        { categoryName: 'Mason', quantity: 25 },
        { categoryName: 'Helper', quantity: 10 },
      ],
    },
  },
  {
    _id: 'alloc-2',
    vendorAcceptedAt: day(-3),
    deployedAt: day(-2),
    notes: 'Night shift not required. Daily attendance mandatory for billing.',
    workersRequired: 18,
    workersAssigned: 18,
    requestId: {
      _id: 'req-2',
      reference: 'WF-2026-0098',
      status: 'in_progress',
      locationText: 'M3M Golf Course Extension, Noida',
      startDate: day(-14),
      endDate: day(46),
      clientName: 'M3M India',
      lines: [
        { categoryName: 'Electrician', quantity: 8 },
        { categoryName: 'Plumber', quantity: 6 },
        { categoryName: 'Helper', quantity: 4 },
      ],
    },
  },
  {
    _id: 'alloc-3',
    vendorAcceptedAt: day(-45),
    deployedAt: day(-44),
    notes: 'Project closed — final attendance reconciliation pending.',
    workersRequired: 12,
    workersAssigned: 12,
    requestId: {
      _id: 'req-3',
      reference: 'WF-2025-0881',
      status: 'billing',
      locationText: 'DLF Cyber City Phase 3, Gurugram',
      startDate: day(-90),
      endDate: day(-5),
      clientName: 'DLF Ltd',
      lines: [{ categoryName: 'Painter', quantity: 12 }],
    },
  },
  {
    _id: 'alloc-4',
    vendorAcceptedAt: day(-1),
    deployedAt: null,
    notes: 'Urgent: 50 workers for 30 days — admin priority allocation.',
    workersRequired: 50,
    workersAssigned: 12,
    requestId: {
      _id: 'req-4',
      reference: 'WF-2026-0155',
      status: 'assigned',
      locationText: 'Godrej Aristocrat, Sector 49, Gurugram',
      startDate: day(5),
      endDate: day(35),
      clientName: 'Godrej Properties',
      lines: [
        { categoryName: 'Mason', quantity: 30 },
        { categoryName: 'Helper', quantity: 20 },
      ],
    },
  },
]

export const VENDOR_DUMMY_ATTENDANCE = [
  {
    _id: 'att-1',
    shiftDate: day(0),
    status: 'present',
    checkIn: '07:42',
    checkOut: '18:05',
    billableUnits: 1,
    siteName: 'M3M Golf Course Extension',
    labourId: { fullName: 'Suresh Yadav' },
  },
  {
    _id: 'att-2',
    shiftDate: day(0),
    status: 'present',
    checkIn: '08:01',
    checkOut: '17:55',
    billableUnits: 1,
    siteName: 'L&T Sector 78',
    labourId: { fullName: 'Ramesh Kumar' },
  },
  {
    _id: 'att-3',
    shiftDate: day(0),
    status: 'absent',
    checkIn: null,
    checkOut: null,
    billableUnits: 0,
    siteName: 'L&T Sector 78',
    labourId: { fullName: 'Mohit Sharma' },
  },
  {
    _id: 'att-4',
    shiftDate: day(-1),
    status: 'present',
    checkIn: '07:55',
    checkOut: '18:10',
    billableUnits: 1,
    siteName: 'M3M Golf Course Extension',
    labourId: { fullName: 'Vikram Patel' },
  },
  {
    _id: 'att-5',
    shiftDate: day(-1),
    status: 'half_day',
    checkIn: '08:30',
    checkOut: '13:00',
    billableUnits: 0.5,
    siteName: 'L&T Sector 78',
    labourId: { fullName: 'Anil Singh' },
  },
]

export const VENDOR_DUMMY_INVOICES = [
  {
    _id: 'inv-1',
    invoiceNumber: 'VND-2026-0312',
    status: 'paid',
    totalAmount: 186400,
    periodLabel: 'Feb 2026 · M3M site',
    paidAt: day(-8),
  },
  {
    _id: 'inv-2',
    invoiceNumber: 'VND-2026-0401',
    status: 'pending',
    totalAmount: 86500,
    periodLabel: 'Mar 2026 · L&T partial',
    paidAt: null,
  },
  {
    _id: 'inv-3',
    invoiceNumber: 'VND-2026-0288',
    status: 'processing',
    totalAmount: 242000,
    periodLabel: 'Jan 2026 · DLF closure',
    paidAt: null,
  },
]

export const VENDOR_DUMMY_WITHDRAWALS = [
  { _id: 'w-1', amount: 100000, status: 'completed', requestedAt: day(-12) },
  { _id: 'w-2', amount: 75000, status: 'processing', requestedAt: day(-2) },
]

export function getVendorDummyAllocation(id) {
  return VENDOR_DUMMY_ALLOCATIONS.find((a) => String(a._id) === String(id)) ?? null
}

export function filterVendorJobs(allocations, tab) {
  const list = (allocations ?? []).filter((a) => !a.vendorRejectedAt)
  if (tab === 'pending') return list.filter((a) => !a.vendorAcceptedAt)
  if (tab === 'active') {
    return list.filter((a) => {
      const s = a.requestId?.status
      return a.vendorAcceptedAt && ['assigned', 'confirmed', 'in_progress', 'attendance_tracking', 'allocating'].includes(s)
    })
  }
  if (tab === 'completed') {
    return list.filter((a) => ['billing', 'completed'].includes(a.requestId?.status))
  }
  return list
}

export function groupAttendanceBySite(records) {
  const map = new Map()
  for (const r of records) {
    const site = r.siteName || 'Unknown site'
    if (!map.has(site)) map.set(site, [])
    map.get(site).push(r)
  }
  return [...map.entries()].map(([siteName, rows]) => ({ siteName, rows }))
}
