/**
 * Admin sidebar — aligned with Work Scope (Super Control Panel modules).
 */
import {
  LayoutDashboard,
  Users,
  IdCard,
  Layers,
  ClipboardList,
  Package,
  Network,
  Clock,
  Wallet,
  BadgeIndianRupee,
  BarChart3,
  Settings,
  Image,
  MessageSquare,
  UserCog,
  Tag,
  Wrench,
  Map,
  HandCoins,
  ClipboardCheck,
  Star,
} from 'lucide-react'

/**
 * Admin Labour hub (`/admin/labour`) shows links to these routes — a curated slice of Work Scope modules
 * that touch roster, KYC, deployment, and time records. Edit here to expand the hub without touching the page.
 */
export const ADMIN_LABOUR_HUB_PATHS = new Set([
  '/admin/categories',
  '/admin/sub-categories',
  '/admin/services',
  '/admin/users',
  '/admin/bookings',
  '/admin/allocations',
  '/admin/attendance',
])

/**
 * @returns {{ title: string | null, items: { to: string, label: string, icon: import('lucide-react').LucideIcon, end?: boolean }[] }[]}
 */
export function getLabourAdminHubNavGroups() {
  return ADMIN_NAV_SECTIONS.map((section) => ({
    title: section.title,
    items: section.items.filter((item) => ADMIN_LABOUR_HUB_PATHS.has(item.to)),
  })).filter((g) => g.items.length > 0)
}

/** @type {{ title: string | null, items: { to: string, label: string, icon: import('lucide-react').LucideIcon, end?: boolean }[] }[]} */
export const ADMIN_NAV_SECTIONS = [
  {
    title: null,
    items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    title: 'Users',
    items: [
      { to: '/admin/users', label: 'Users', icon: Users },
    ],
  },
  {
    title: 'Workforce',
    items: [
      { to: '/admin/labour', label: 'Labour & KYC', icon: IdCard },
    ],
  },
  {
    title: 'Skill categories',
    items: [
      { to: '/admin/categories', label: 'Categories', icon: Layers },
      { to: '/admin/sub-categories', label: 'Sub-Categories', icon: Tag },
      { to: '/admin/services', label: 'Services', icon: Wrench },
    ],
  },
  {
    title: 'Operations',
    items: [
      { to: '/admin/bookings', label: 'Bookings & requests', icon: ClipboardList },
      { to: '/admin/allocations', label: 'Workforce allocation', icon: Network },
      { to: '/admin/attendance', label: 'Attendance', icon: Clock },
      { to: '/admin/complaints', label: 'Complaints', icon: MessageSquare },
      { to: '/admin/zone-management', label: 'Zone Management', icon: Map },
      { to: '/admin/zones', label: 'Manage Radius', icon: Map },
    ],
  },
  {
    title: 'Finance',
    items: [
      { to: '/admin/billing', label: 'Payments & billing', icon: Wallet },
      { to: '/admin/pricing', label: 'Pricing & rates', icon: BadgeIndianRupee },
      { to: '/admin/platform-fee', label: 'Platform Fee', icon: HandCoins },
      { to: '/admin/commission-fee', label: 'Commission Fee', icon: HandCoins },
      { to: '/admin/labour-wallet', label: 'Labour Wallet', icon: Wallet },
      { to: '/admin/cash-management', label: 'Cash Management', icon: Wallet },
    ],
  },
  {
    title: 'Insights',
    items: [{ to: '/admin/reports', label: 'Reports & analytics', icon: BarChart3 }],
  },
  {
    title: 'Content',
    items: [
      { to: '/admin/banners', label: 'Banners', icon: Image },
    ],
  },
  {
    title: 'System',
    items: [
      { to: '/admin/profile', label: 'Profile', icon: UserCog },
      { to: '/admin/settings', label: 'Settings', icon: Settings },
      { to: '/admin/reviews', label: 'Reviews & Ratings', icon: Star },
    ],
  },
]

const ROUTE_TITLES = [
  { prefix: '/admin/profile', title: 'Profile' },
  { prefix: '/admin/complaints', title: 'Complaints' },
  { prefix: '/admin/settings', title: 'Settings' },
  { prefix: '/admin/banners', title: 'Banners' },
  { prefix: '/admin/reports', title: 'Reports & analytics' },
  { prefix: '/admin/pricing', title: 'Pricing & rates' },
  { prefix: '/admin/platform-fee', title: 'Platform Fee' },
  { prefix: '/admin/commission-fee', title: 'Commission Fee' },
  { prefix: '/admin/labour-wallet', title: 'Labour Wallet' },
  { prefix: '/admin/cash-management', title: 'Cash Management' },
  { prefix: '/admin/billing', title: 'Payments & billing' },
  { prefix: '/admin/reviews', title: 'Reviews & Ratings' },
  { prefix: '/admin/attendance', title: 'Attendance' },
  { prefix: '/admin/allocations', title: 'Workforce allocation' },
  { prefix: '/admin/bookings', title: 'Bookings & requests' },
  { prefix: '/admin/services', title: 'Services' },
  { prefix: '/admin/sub-categories', title: 'Sub-Categories' },
  { prefix: '/admin/categories', title: 'Categories' },
  { prefix: '/admin/labour', title: 'Labour & KYC' },
  { prefix: '/admin/users', title: 'Users' },
  { prefix: '/admin/zone-management', title: 'Zone Management' },
  { prefix: '/admin/zones', title: 'Manage Radius' },
  { prefix: '/admin', title: 'Dashboard' },
]

export function getAdminTitle(pathname) {
  const path = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname
  for (const { prefix, title } of ROUTE_TITLES) {
    if (path === prefix || (prefix !== '/admin' && path.startsWith(prefix + '/'))) return title
  }
  return 'Admin'
}
