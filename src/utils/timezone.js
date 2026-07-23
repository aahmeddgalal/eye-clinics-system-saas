import { formatInTimeZone } from 'date-fns-tz'

export const TIMEZONE = 'Africa/Cairo'

/**
 * Returns the start and end of the current day in Cairo, as UTC ISO strings.
 * Use this for querying "today" from Supabase.
 */
export function getCairoTodayRange() {
  const now = new Date()
  
  // Format the start and end of today in Cairo, including the exact offset (e.g. +03:00)
  const startOfDayString = formatInTimeZone(now, TIMEZONE, "yyyy-MM-dd'T'00:00:00.000XXX")
  const endOfDayString = formatInTimeZone(now, TIMEZONE, "yyyy-MM-dd'T'23:59:59.999XXX")

  return {
    start: new Date(startOfDayString).toISOString(),
    end: new Date(endOfDayString).toISOString()
  }
}

/**
 * Format any date string or Date object into a readable Cairo date (e.g. 15 Oct 2023)
 */
export function formatCairoDate(dateInput) {
  if (!dateInput) return ''
  const date = new Date(dateInput)
  return date.toLocaleDateString('ar-EG', { timeZone: TIMEZONE })
}

/**
 * Format any date string or Date object into a readable Cairo time (e.g. 02:30 PM)
 */
export function formatCairoTime(dateInput) {
  if (!dateInput) return ''
  const date = new Date(dateInput)
  return date.toLocaleTimeString('ar-EG', { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit' })
}

/**
 * Format any date string or Date object into a readable Cairo date and time
 */
export function formatCairoDateTime(dateInput) {
  if (!dateInput) return ''
  const date = new Date(dateInput)
  return date.toLocaleString('ar-EG', { timeZone: TIMEZONE })
}

/**
 * Gets the current time as an ISO string, ensuring the server doesn't alter the actual timestamp.
 * (new Date().toISOString() is already universally UTC, so it's technically fine, 
 * but this serves as a semantic wrapper).
 */
export function getNowUTC() {
  return new Date().toISOString()
}
