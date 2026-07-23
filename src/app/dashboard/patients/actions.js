'use server'

import { createClient, requireAuth } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

import { checkPatientDuplicate, sanitizeInput, normalizeArabicText } from '@/utils/validation'

export async function createPatientAction(formData) {
  const { supabase } = await requireAuth()

  const fullName = normalizeArabicText(formData.get('full_name') || '')
  const phone = formData.get('phone')

  const duplicate = await checkPatientDuplicate(supabase, fullName, phone)
  if (duplicate) {
    return { duplicate }
  }

  const data = {
    full_name: fullName,
    age: formData.get('age') ? parseInt(formData.get('age')) : null,
    gender: formData.get('gender'),
    phone: phone,
    address: sanitizeInput(formData.get('address')),
    marital_status: formData.get('marital_status'),
    notes: sanitizeInput(formData.get('notes')),
  }

  const { error } = await supabase.from('patients').insert(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/patients')
  return { success: true }
}

export async function updatePatientAction(id, formData) {
  const { supabase } = await requireAuth()
  
  const fullName = normalizeArabicText(formData.get('full_name') || '')
  const phone = formData.get('phone')
  
  const duplicate = await checkPatientDuplicate(supabase, fullName, phone, id)
  if (duplicate) {
    return { error: 'هذا المريض مسجل بالفعل مسبقاً (بنفس الاسم أو رقم الهاتف).' }
  }

  const data = {
    full_name: fullName,
    age: formData.get('age') ? parseInt(formData.get('age')) : null,
    gender: formData.get('gender'),
    phone: phone,
    address: sanitizeInput(formData.get('address')),
    marital_status: formData.get('marital_status'),
    notes: sanitizeInput(formData.get('notes')),
  }

  const { error } = await supabase.from('patients').update(data).eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/patients')
  return { success: true }
}

export async function createPatientInlineAction(dataOrString) {
  const { supabase } = await requireAuth()
  
  let full_name = ''
  let phone = null
  let age = null
  let gender = null
  let address = null
  let notes = null

  if (typeof dataOrString === 'string') {
    const isPhone = /^[0-9+\s]+$/.test(dataOrString.trim())
    full_name = isPhone ? 'مريض جديد' : dataOrString.trim()
    phone = isPhone ? dataOrString.trim() : null
  } else {
    full_name = dataOrString.full_name
    phone = dataOrString.phone
    age = dataOrString.age
    gender = dataOrString.gender
    address = dataOrString.address
    notes = dataOrString.notes
  }

  full_name = normalizeArabicText(full_name)
  
  const duplicate = await checkPatientDuplicate(supabase, full_name, phone)
  if (duplicate) {
    return { error: 'هذا المريض مسجل بالفعل مسبقاً.' }
  }

  const data = {
    full_name,
    phone,
    age,
    gender,
    address,
    notes
  }

  const { data: newPatient, error } = await supabase
    .from('patients')
    .insert(data)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/patients')
  revalidatePath('/dashboard/queue')
  revalidatePath('/dashboard/visits')
  return { success: true, data: newPatient }
}

export async function deletePatientAction(id) {
  const { supabase } = await requireAuth()
  const now = new Date().toISOString()

  // Soft delete patient
  const { error } = await supabase.from('patients').update({ deleted_at: now }).eq('id', id)

  if (error) {
    return { error: error.message }
  }
  
  // Cascade soft deletes
  await supabase.from('visits').update({ deleted_at: now }).eq('patient_id', id)
  await supabase.from('prescriptions').update({ deleted_at: now }).eq('patient_id', id)
  await supabase.from('eye_measurements').update({ deleted_at: now }).eq('patient_id', id)
  await supabase.from('patient_notes').update({ deleted_at: now }).eq('patient_id', id)
  await supabase.from('attachments').update({ deleted_at: now }).eq('patient_id', id)
  
  // Remove from today's queue
  await supabase.from('todays_queue').delete().eq('patient_id', id)

  revalidatePath('/dashboard/patients')
  revalidatePath('/dashboard/queue')
  return { success: true }
}

export async function restorePatientAction(id) {
  const { supabase } = await requireAuth()

  // Restore patient
  const { error } = await supabase.from('patients').update({ deleted_at: null }).eq('id', id)

  if (error) {
    return { error: error.message }
  }
  
  // Cascade restores
  await supabase.from('visits').update({ deleted_at: null }).eq('patient_id', id)
  await supabase.from('prescriptions').update({ deleted_at: null }).eq('patient_id', id)
  await supabase.from('eye_measurements').update({ deleted_at: null }).eq('patient_id', id)
  await supabase.from('patient_notes').update({ deleted_at: null }).eq('patient_id', id)

  revalidatePath('/dashboard/patients')
  revalidatePath('/dashboard/trash')
  return { success: true }
}

export async function getAllEyeMeasurementsAction(patientId) {
  if (!patientId) return { data: [] }
  const { supabase } = await requireAuth()

  const { data, error } = await supabase
    .from('eye_measurements')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching eye measurements:", error)
    return { data: [] }
  }

  return { data: data || [] }
}

export async function createEyeMeasurementAction(formData) {
  const { supabase } = await requireAuth()

  const patient_id = formData.get('patient_id')
  let visit_id = formData.get('visit_id')
  
  if (!patient_id) {
    return { error: 'Please select a registered patient to save measurements.' }
  }

  // If no visit_id provided (e.g. standalone measurement creation), create a quick visit to link it
  if (!visit_id) {
    const { data: visit, error: visitError } = await supabase
      .from('visits')
      .insert({ patient_id, visit_date: new Date().toISOString() })
      .select()
      .single()
      
    if (visitError) return { error: `Failed to create visit for measurement: ${visitError.message}` }
    visit_id = visit.id
  }

  const data = {
    patient_id,
    visit_id,
    right_sph: formData.get('right_sph') ? parseFloat(formData.get('right_sph')) : null,
    right_cyl: formData.get('right_cyl') ? parseFloat(formData.get('right_cyl')) : null,
    right_axis: formData.get('right_axis') ? parseFloat(formData.get('right_axis')) : null,
    right_add: formData.get('right_add') ? parseFloat(formData.get('right_add')) : null,
    left_sph: formData.get('left_sph') ? parseFloat(formData.get('left_sph')) : null,
    left_cyl: formData.get('left_cyl') ? parseFloat(formData.get('left_cyl')) : null,
    left_axis: formData.get('left_axis') ? parseFloat(formData.get('left_axis')) : null,
    left_add: formData.get('left_add') ? parseFloat(formData.get('left_add')) : null,
    ipd_distance: formData.get('ipd_distance') ? parseFloat(formData.get('ipd_distance')) : null,
    ipd_near: formData.get('ipd_near') ? parseFloat(formData.get('ipd_near')) : null,
  }

  const { error } = await supabase.from('eye_measurements').insert(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/patients/${patient_id}`)
  return { success: true }
}

export async function updateEyeMeasurementAction(id, formData) {
  const { supabase } = await requireAuth()

  const patient_id = formData.get('patient_id')
  
  if (!id || !patient_id) {
    return { error: 'Missing required fields.' }
  }

  const data = {
    right_sph: formData.get('right_sph') ? parseFloat(formData.get('right_sph')) : null,
    right_cyl: formData.get('right_cyl') ? parseFloat(formData.get('right_cyl')) : null,
    right_axis: formData.get('right_axis') ? parseFloat(formData.get('right_axis')) : null,
    right_add: formData.get('right_add') ? parseFloat(formData.get('right_add')) : null,
    left_sph: formData.get('left_sph') ? parseFloat(formData.get('left_sph')) : null,
    left_cyl: formData.get('left_cyl') ? parseFloat(formData.get('left_cyl')) : null,
    left_axis: formData.get('left_axis') ? parseFloat(formData.get('left_axis')) : null,
    left_add: formData.get('left_add') ? parseFloat(formData.get('left_add')) : null,
    ipd_distance: formData.get('ipd_distance') ? parseFloat(formData.get('ipd_distance')) : null,
    ipd_near: formData.get('ipd_near') ? parseFloat(formData.get('ipd_near')) : null,
  }

  const { error } = await supabase.from('eye_measurements').update(data).eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/patients/${patient_id}`)
  return { success: true }
}

export async function deleteEyeMeasurementAction(id, patient_id) {
  const { supabase } = await requireAuth()
  const now = new Date().toISOString()

  const { error } = await supabase.from('eye_measurements').update({ deleted_at: now }).eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/patients/${patient_id}`)
  return { success: true }
}

// ------------------------------------------------------------------
// Patient Notes Actions
// ------------------------------------------------------------------

export async function createPatientNoteAction(patientId, content, visitId = null) {
  const { supabase } = await requireAuth()
  const { data, error } = await supabase
    .from('patient_notes')
    .insert({ patient_id: patientId, content: sanitizeInput(content), visit_id: visitId })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/patients/${patientId}`)
  return { success: true, data }
}

export async function updatePatientNoteAction(noteId, content, patientId) {
  const { supabase } = await requireAuth()
  const { error } = await supabase
    .from('patient_notes')
    .update({ content: sanitizeInput(content), updated_at: new Date().toISOString() })
    .eq('id', noteId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/patients/${patientId}`)
  return { success: true }
}

export async function deletePatientNoteAction(noteId, patientId) {
  const { supabase } = await requireAuth()
  const { error } = await supabase
    .from('patient_notes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', noteId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/patients/${patientId}`)
  return { success: true }
}

// ------------------------------------------------------------------
// Prescription Actions
// ------------------------------------------------------------------

export async function updatePrescriptionAction(prescriptionId, visitId, patientId, medicationsData, doctorNotes, diagnosis) {
  try {
    const { supabase } = await requireAuth()
    
    console.log("updatePrescriptionAction - Payload:", {
      prescriptionId, visitId, patientId, medicationsData, doctorNotes, diagnosis
    })

    const { error: rxError } = await supabase
      .from('prescriptions')
      .update({ 
        medications_data: medicationsData,
        doctor_notes: doctorNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', prescriptionId)

    if (rxError) {
      console.error("updatePrescriptionAction - Supabase Error updating prescription:", rxError)
      return { 
        error: rxError.message, 
        details: rxError.details, 
        hint: rxError.hint, 
        code: rxError.code 
      }
    }

    if (visitId) {
      const { error: visitError } = await supabase
        .from('visits')
        .update({
          diagnosis: diagnosis,
          updated_at: new Date().toISOString()
        })
        .eq('id', visitId)
        
      if (visitError) {
        console.error("updatePrescriptionAction - Supabase Error updating visit diagnosis:", visitError)
        // Optionally fail the whole request or just return the warning
        return { 
          error: "Failed to update visit diagnosis: " + visitError.message,
          details: visitError.details,
          code: visitError.code
        }
      }
    }

    revalidatePath(`/dashboard/patients/${patientId}`)
    return { success: true }
  } catch (err) {
    console.error("updatePrescriptionAction - Unexpected Error:", err)
    return { error: err.message || "Unexpected server error occurred." }
  }
}

export async function deletePrescriptionAction(prescriptionId, patientId) {
  const { supabase } = await requireAuth()
  const { error } = await supabase
    .from('prescriptions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', prescriptionId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/patients/${patientId}`)
  return { success: true }
}

export async function searchPatientsAction(query) {
  const { supabase } = await requireAuth()
  if (!query) {
    const { data } = await supabase.from('patients').select('*').is('deleted_at', null).order('updated_at', { ascending: false }).limit(10)
    return { data: data || [] }
  }
  const { data, error } = await supabase.from('patients').select('*').is('deleted_at', null).or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`).order('updated_at', { ascending: false }).limit(20)
  if (error) return { error: error.message }
  return { data: data || [] }
}