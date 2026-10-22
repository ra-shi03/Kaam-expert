/**
 * Utility functions for booking time and duration calculations.
 */

/**
 * Formats any 24-hour ("10:00", "14:00") or 12-hour ("10:00 AM") time string into a clean 12-hour AM/PM string.
 * Examples:
 *   "10:00" -> "10:00 AM"
 *   "14:00" -> "2:00 PM"
 *   "13:24" -> "1:24 PM"
 *   "00:30 (+1 day)" -> "12:30 AM (+1 day)"
 *
 * @param {string} timeStr
 * @returns {string} e.g. "10:00 AM", "2:00 PM"
 */
export function formatTime12(timeStr) {
  if (!timeStr) return ''
  const str = String(timeStr).trim()
  if (!str) return ''

  // If already in 12-hour format e.g. "10:00 AM", "01:24 PM (+1 day)"
  const match12 = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)(.*)$/i)
  if (match12) {
    const h = parseInt(match12[1], 10)
    const m = match12[2]
    const ampm = match12[3].toUpperCase()
    const suffix = match12[4] || ''
    return `${h}:${m} ${ampm}${suffix}`
  }

  // 24-hour format e.g. "10:00", "14:00 (+1 day)"
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

/**
 * Calculates the end time given a start time string and duration in minutes.
 * Supports 24-hour ("10:00", "13:24") and 12-hour ("10:00 AM", "01:24 PM") start times.
 * By default returns user-friendly 12-hour formatted time (e.g. "2:00 PM", "7:24 PM").
 * Handles day rollover with "(+N day(s))".
 *
 * Example:
 *   calculateEndTime("10:00", 240) -> "2:00 PM" (4 hours after 10 AM)
 *   calculateEndTime("10:00 AM", 240) -> "2:00 PM"
 *   calculateEndTime("13:24", 360) -> "7:24 PM" (6 hours after 1:24 PM)
 *
 * @param {string} startTimeStr
 * @param {number|string} durationMinutes
 * @param {boolean} return12Hour
 * @returns {string} e.g. "2:00 PM" or "02:00 AM (+1 day)"
 */
export function calculateEndTime(startTimeStr, durationMinutes, return12Hour = true) {
  if (!startTimeStr || durationMinutes == null || isNaN(Number(durationMinutes))) return ''
  const dur = Math.round(Number(durationMinutes))
  if (dur <= 0) return formatTime12(startTimeStr)

  let startH = 0
  let startM = 0

  // Check 12-hour format e.g. "01:24 PM", "9:30 am", "10:00 AM"
  const match12 = String(startTimeStr).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (match12) {
    let h = parseInt(match12[1], 10)
    startM = parseInt(match12[2], 10)
    const ampm = match12[3].toUpperCase()
    if (ampm === 'PM' && h < 12) h += 12
    if (ampm === 'AM' && h === 12) h = 0
    startH = h
  } else {
    // Check 24-hour format e.g. "10:00", "13:24"
    const match24 = String(startTimeStr).trim().match(/^(\d{1,2}):(\d{2})/)
    if (!match24) return ''
    startH = parseInt(match24[1], 10)
    startM = parseInt(match24[2], 10)
  }

  if (isNaN(startH) || isNaN(startM)) return ''

  const totalStartMinutes = startH * 60 + startM
  const totalEndMinutes = totalStartMinutes + dur

  const daysRollover = Math.floor(totalEndMinutes / (24 * 60))
  const endMinutesInDay = ((totalEndMinutes % (24 * 60)) + (24 * 60)) % (24 * 60)

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

  const formattedTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
  return `${formattedTime}${rolloverSuffix}`
}

/**
 * Calculates duration in minutes from a booking draft object.
 * Checks draft.durationMinutes first, then hours, then durationKind/days fallback.
 *
 * @param {object} draft
 * @returns {number} duration in minutes
 */
export function getDraftDurationMinutes(draft) {
  if (!draft) return 60
  if (draft.durationMinutes && Number(draft.durationMinutes) > 0) {
    return Math.round(Number(draft.durationMinutes))
  }
  const kind = draft.durationKind || 'few_hours'
  const days = draft.durationDays && Number(draft.durationDays) > 0 ? Number(draft.durationDays) : 1
  if (draft.bookingType === 'instant') {
    const instantHours = parseFloat(draft.hours) || parseFloat(draft.minHours) || 1
    return Math.round(instantHours * 60)
  }
  if (kind === 'multi_day') {
    return Math.round(days * 8 * 60)
  }
  if (kind === 'full_day') {
    return 8 * 60
  }
  if (kind === 'half_day') {
    return 4 * 60
  }
  const customHours = parseFloat(draft.hours) || parseFloat(draft.minHours) || 1
  return Math.round(customHours * 60)
}
