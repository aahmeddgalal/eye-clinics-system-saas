/**
 * Normalizes Arabic text to handle common spelling variations (أ, إ, آ, ة, ى)
 * and removes excessive spaces for strict duplicate checking.
 */
export function normalizeArabicText(text) {
  if (!text) return ''
  return text.trim().toLowerCase()
    .replace(/[أإآا]/g, 'ا')
    .replace(/[ةه]/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .replace(/\s+/g, ' ')
}

/**
 * Normalizes phone numbers by removing spaces and dashes.
 */
export function normalizePhoneNumber(phone) {
  if (!phone) return null
  return phone.replace(/[\s-]/g, '')
}

/**
 * Strip basic HTML tags to prevent XSS (Cross-Site Scripting).
 * Only allows plain text to be stored.
 */
export function sanitizeInput(input) {
  if (!input) return input
  if (typeof input !== 'string') return input
  return input.replace(/<[^>]*>?/gm, '')
}

/**
 * Checks for a duplicate patient based on normalized name or phone number.
 * @param {Object} supabase - Supabase client instance
 * @param {string} fullName - The patient's full name
 * @param {string} phone - The patient's phone number
 * @param {string|null} excludeId - (Optional) Patient ID to exclude from checks (e.g. during an update)
 * @returns {Object|null} The duplicate patient data if found, otherwise null.
 */
export async function checkPatientDuplicate(supabase, fullName, phone, excludeId = null) {
  const normalizedInputName = normalizeArabicText(fullName)
  const normalizedInputPhone = normalizePhoneNumber(phone)

  let query = supabase
    .from('patients')
    .select('id, full_name, phone')
    .is('deleted_at', null)

  // Use the fast normalized_name column directly
  if (normalizedInputPhone) {
    query = query.or(`normalized_name.eq."${normalizedInputName}",phone.eq."${normalizedInputPhone}"`)
  } else {
    query = query.eq('normalized_name', normalizedInputName)
  }

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data: allPatients } = await query

  if (!allPatients || allPatients.length === 0) return null

  // Since we filtered via DB, just grab the first one
  const duplicate = allPatients[0]

  if (duplicate) {
    // Fetch their last visit date
    const { data: visitsData } = await supabase
      .from('visits')
      .select('visit_date')
      .eq('patient_id', duplicate.id)
      .is('deleted_at', null)
      .order('visit_date', { ascending: false })
      .limit(1)

    return {
      id: duplicate.id,
      full_name: duplicate.full_name,
      phone: duplicate.phone,
      last_visit_date: visitsData?.[0]?.visit_date || null
    }
  }

  return null
}
