export function parseISTDateTime(dateString, timeSlot) {
  if (!dateString) return new Date();

  const hasTimeComponent = typeof dateString === 'string' && dateString.includes('T') && !dateString.endsWith('T00:00:00.000Z')
  const timeMatch12 = timeSlot ? timeSlot.match(/(\d+):(\d+)\s*(AM|PM)/i) : null
  const timeMatch24 = timeSlot ? timeSlot.match(/(\d+):(\d+)/) : null

  if (hasTimeComponent && !timeMatch12 && !timeMatch24) {
    const parsed = new Date(dateString)
    if (!isNaN(parsed.getTime())) return parsed
  }

  // Clean up dateString to handle "18 Jul 2026" or "2026-07-18"
  let datePart = typeof dateString === 'string' ? dateString.split('T')[0] : ''

  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const d = new Date(dateString)
    if (!isNaN(d.getTime())) {
      const pad = (n) => n.toString().padStart(2, '0')
      datePart = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    } else {
      return new Date() // Fallback
    }
  }

  let h = 0, m = 0
  if (timeMatch12) {
    const [ , hStr, mStr, ampm ] = timeMatch12
    h = parseInt(hStr, 10)
    m = parseInt(mStr, 10)
    if (ampm.toUpperCase() === 'PM' && h < 12) h += 12
    if (ampm.toUpperCase() === 'AM' && h === 12) h = 0
  } else if (timeMatch24) {
    h = parseInt(timeMatch24[1], 10)
    m = parseInt(timeMatch24[2], 10)
  } else {
    return new Date(`${datePart}T00:00:00.000+05:30`)
  }

  const pad = (n) => n.toString().padStart(2, '0')
  const isoString = `${datePart}T${pad(h)}:${pad(m)}:00.000+05:30`
  return new Date(isoString)
}
