/**
 * Turns admin-written policy text into sections the public pages can render.
 * Supported: "## Heading" (new section), "### Sub heading", "- bullets", "1. numbered",
 * "**bold**", "[text](url)", plain emails/URLs. Output is data (never HTML), so it renders safely.
 */

export const AUDIENCES = {
  users: { role: 'customer', label: 'Customers', short: 'Users', authPath: '/users/auth' },
  labours: { role: 'labour', label: 'Labour partners', short: 'Labour', authPath: '/labours/auth' },
}

export const LEGAL_PAGES = [
  { type: 'privacy', slug: 'privacy-policy', label: 'Privacy Policy' },
  { type: 'terms', slug: 'terms-and-conditions', label: 'Terms & Conditions' },
  { type: 'support', slug: 'support', label: 'Support' },
]

export const legalPath = (audience, type) => {
  const page = LEGAL_PAGES.find((p) => p.type === type)
  return `/${audience}/${page?.slug ?? ''}`
}

export const DEFAULT_COMPANY = {
  brandName: 'Kaam Expert',
  legalName: 'Kaam Expert',
  cin: 'U70200MP2024PTC070197',
  address: 'EWS C 47 Housing Board Colony, Sehore, Madhya Pradesh, 466001, India',
  phone: '6267752613',
  email: 'kaamexpertnew@gmail.com',
  website: 'https://kaamexpert.in',
  supportHours: 'Monday to Saturday, 9:00 AM – 7:00 PM',
}

export function formatPhone(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '')
  const local = digits.length > 10 ? digits.slice(-10) : digits
  return local.length === 10 ? `+91 ${local.slice(0, 5)} ${local.slice(5)}` : String(phone ?? '')
}

export function telHref(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '')
  if (!digits) return undefined
  return `tel:${digits.length === 10 ? `+91${digits}` : `+${digits}`}`
}

function fillPlaceholders(text, company) {
  const c = { ...DEFAULT_COMPANY, ...(company ?? {}) }
  const values = {
    company_name: c.brandName,
    legal_name: c.legalName,
    cin: c.cin,
    address: c.address,
    phone: formatPhone(c.phone),
    email: c.email,
    website: c.website,
    support_hours: c.supportHours,
  }
  return String(text ?? '').replace(/\{\{\s*(\w+)\s*\}\}/g, (m, key) => (key in values ? values[key] : m))
}

export function isSafeUrl(url) {
  return /^(https?:\/\/|mailto:|tel:|\/)/i.test(url)
}

const INLINE_RE = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\)|https?:\/\/[^\s)]+|[\w.+-]+@[\w-]+\.[\w.-]+)/g

export function parseInline(text) {
  const out = []
  let last = 0
  for (const m of text.matchAll(INLINE_RE)) {
    if (m.index > last) out.push({ kind: 'text', text: text.slice(last, m.index) })
    const token = m[0]
    if (token.startsWith('**')) {
      out.push({ kind: 'bold', text: token.slice(2, -2) })
    } else if (token.startsWith('[')) {
      const close = token.indexOf('](')
      const href = token.slice(close + 2, -1)
      out.push(isSafeUrl(href) ? { kind: 'link', text: token.slice(1, close), href } : { kind: 'text', text: token })
    } else if (token.includes('@') && !token.startsWith('http')) {
      out.push({ kind: 'link', text: token, href: `mailto:${token}` })
    } else {
      out.push({ kind: 'link', text: token, href: token })
    }
    last = m.index + token.length
  }
  if (last < text.length) out.push({ kind: 'text', text: text.slice(last) })
  return out
}

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

export function parseLegalContent(raw, company) {
  const lines = fillPlaceholders(raw, company).replace(/\r\n?/g, '\n').split('\n')
  const sections = []
  let section = null
  let para = []
  let list = null

  const ensureSection = () => {
    if (!section) {
      section = { id: 'overview', title: '', blocks: [] }
      sections.push(section)
    }
    return section
  }
  const flushPara = () => {
    if (para.length) ensureSection().blocks.push({ type: 'p', text: para.join(' ') })
    para = []
  }
  const flushList = () => {
    if (list) ensureSection().blocks.push(list)
    list = null
  }
  const flush = () => {
    flushPara()
    flushList()
  }

  for (const line of lines) {
    const t = line.trim()
    if (!t) {
      flush()
      continue
    }
    if (/^#{1}\s/.test(t) && !t.startsWith('##')) continue // document title is shown by the page
    const h2 = t.match(/^##\s+(.+)/)
    if (h2 && !t.startsWith('###')) {
      flush()
      const title = h2[1].trim()
      const used = sections.filter((s) => s.id.startsWith(slugify(title) || 'section')).length
      section = { id: `${slugify(title) || 'section'}${used ? `-${used + 1}` : ''}`, title, blocks: [] }
      sections.push(section)
      continue
    }
    const h3 = t.match(/^###\s+(.+)/)
    if (h3) {
      flush()
      ensureSection().blocks.push({ type: 'h3', text: h3[1].trim() })
      continue
    }
    const ul = t.match(/^[-*•]\s+(.+)/)
    const ol = t.match(/^\d+[.)]\s+(.+)/)
    if (ul || ol) {
      flushPara()
      const ordered = Boolean(ol)
      if (!list || list.ordered !== ordered) {
        flushList()
        list = { type: 'list', ordered, items: [] }
      }
      list.items.push((ul || ol)[1].trim())
      continue
    }
    flushList()
    para.push(t)
  }
  flush()
  return sections
}
