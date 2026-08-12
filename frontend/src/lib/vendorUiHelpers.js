export function openVendorDrawer() {
  window.dispatchEvent(new CustomEvent('lc-open-vendor-drawer'))
}

export function vendorInitials(name) {
  if (!name?.trim()) return '?'
  const parts = name.trim().split(/\s+/)
  return `${parts[0]?.[0] || ''}${parts.length > 1 ? parts[parts.length - 1]?.[0] : ''}`.toUpperCase() || '?'
}

export function vendorTimeGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function formatVendorInr(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n ?? 0)
}
