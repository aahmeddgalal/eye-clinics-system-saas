'use server'

import { createClient, requireAuth } from '@/utils/supabase/server'
import { normalizeArabicText } from '@/utils/validation'

export async function searchPatients(query) {
  if (!query) return []
  
  const normalizedQuery = normalizeArabicText(query)
  const { supabase } = await requireAuth()
  const { data, error } = await supabase
    .from('patients')
    .select('id, full_name, phone, age, visits(visit_date)')
    .is('deleted_at', null)
    .or(`normalized_name.ilike.%${normalizedQuery}%,phone.ilike.%${query}%`)

  if (error) {
    console.error('Error in searchPatients:', error)
    return []
  }

  // Format last_visit for the autocomplete
  const formattedData = data.map(p => {
    const visits = p.visits || []
    const lastVisit = visits.length ? visits.sort((a,b) => new Date(b.visit_date) - new Date(a.visit_date))[0].visit_date : null
    return {
      ...p,
      last_visit: lastVisit
    }
  })

  return formattedData
}

export async function searchDiseases(query) {
  if (!query) return []
  
  const { supabase } = await requireAuth()
  const { data, error } = await supabase
    .from('diseases')
    .select('id, name')
    .is('deleted_at', null)
    .ilike('name', `%${query}%`)
    .limit(5)

  if (error) {
    console.error('Error in searchDiseases:', error)
    return []
  }

  return data
}

export async function searchMedications(query) {
  if (!query) return []
  
  const { supabase } = await requireAuth()
  const { data, error } = await supabase
    .from('medications')
    .select('id, name')
    .is('deleted_at', null)
    .neq('is_active', false)
    .ilike('name', `%${query}%`)
    .limit(5)

  if (error) {
    console.error('Error in searchMedications:', error)
    return []
  }

  return data
}
