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

export function formatTime12(timeStr) {
  if (!timeStr) return ''
  const str = String(timeStr).trim()
  if (!str) return ''

  const match12 = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)(.*)$/i)
  if (match12) {
    const h = parseInt(match12[1], 10)
    const m = match12[2]
    const ampm = match12[3].toUpperCase()
    const suffix = match12[4] || ''
    return `${h}:${m} ${ampm}${suffix}`
  }

  const match24 = str.match(/^(\d{1,2}):(\d{2})(.*)$/)
  if (!match24) return str

  let h = parseInt(match24[1], 10)
  const m = match24[2]
  const suffix = match24[3] || ''
  const ampm = h >= 12 ? 'PM' : 'AM'
  if (h === 0) h = 12
  else if (h > 12) h -= 12

  return `${h}:${m} ${ampm}${suffix}`
}

export function calculateEndTime(timeSlot, durationMinutes, return12Hour = true) {
  if (!timeSlot || !durationMinutes || isNaN(Number(durationMinutes))) return ''
  const dur = Math.round(Number(durationMinutes))
  if (dur <= 0) return formatTime12(timeSlot)

  const timeMatch12 = String(timeSlot).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  const timeMatch24 = String(timeSlot).trim().match(/^(\d{1,2}):(\d{2})/)
  let h = 0, m = 0

  if (timeMatch12) {
    let th = parseInt(timeMatch12[1], 10)
    m = parseInt(timeMatch12[2], 10)
    const ampm = timeMatch12[3].toUpperCase()
    if (ampm === 'PM' && th < 12) th += 12
    if (ampm === 'AM' && th === 12) th = 0
    h = th
  } else if (timeMatch24) {
    h = parseInt(timeMatch24[1], 10)
    m = parseInt(timeMatch24[2], 10)
  } else {
    return ''
  }

  const endTotal = h * 60 + m + dur
  const daysRollover = Math.floor(endTotal / (24 * 60))
  const endMinutesInDay = ((endTotal % (24 * 60)) + (24 * 60)) % (24 * 60)
  const endH = Math.floor(endMinutesInDay / 60)
  const endM = endMinutesInDay % 60
  const rolloverSuffix = daysRollover > 0 ? ` (+${daysRollover} day${daysRollover > 1 ? 's' : ''})` : ''

  if (return12Hour) {
    let displayH = endH
    const ampm = displayH >= 12 ? 'PM' : 'AM'
    if (displayH === 0) displayH = 12
    else if (displayH > 12) displayH -= 12
    return `${displayH}:${String(endM).padStart(2, '0')} ${ampm}${rolloverSuffix}`
  }

  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(endH)}:${pad(endM)}${rolloverSuffix}`
}

