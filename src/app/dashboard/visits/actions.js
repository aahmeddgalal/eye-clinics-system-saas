'use server'

import { createClient, requireAuth } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { sanitizeInput } from '@/utils/validation'

/**
 * Creates a full visit including diseases, prescriptions, and medications.
 * Note: Since standard Supabase JS over REST doesn't natively support 
 * multi-table transactions without RPCs, we execute sequentially and catch errors.
 */
export async function createFullVisitAction(patientId, formData) {
  const { supabase } = await requireAuth()

  // 1. Parse simple form data and sanitize to prevent XSS
  const diagnosis = sanitizeInput(formData.get('diagnosis'))
  const notes = sanitizeInput(formData.get('notes'))
  const doctorNotes = sanitizeInput(formData.get('doctor_notes'))

  // Parse complex JSON arrays from hidden inputs
  const selectedDiseases = JSON.parse(formData.get('selected_diseases') || '[]')
  const selectedMedications = JSON.parse(formData.get('selected_medications') || '[]')

  try {
    // Parse Eye Measurements
    const rightSph = formData.get('right_sph')
    const rightCyl = formData.get('right_cyl')
    const rightAxis = formData.get('right_axis')
    const rightAdd = formData.get('right_add')
    const leftSph = formData.get('left_sph')
    const leftCyl = formData.get('left_cyl')
    const leftAxis = formData.get('left_axis')
    const leftAdd = formData.get('left_add')
    const ipdDistance = formData.get('ipd_distance')
    const ipdNear = formData.get('ipd_near')

    let eyeMeasurements = null
    if (rightSph || rightCyl || rightAxis || rightAdd || leftSph || leftCyl || leftAxis || leftAdd || ipdDistance || ipdNear) {
      eyeMeasurements = {
        right_sph: rightSph ? parseFloat(rightSph) : null,
        right_cyl: rightCyl ? parseFloat(rightCyl) : null,
        right_axis: rightAxis ? parseFloat(rightAxis) : null,
        right_add: rightAdd ? parseFloat(rightAdd) : null,
        left_sph: leftSph ? parseFloat(leftSph) : null,
        left_cyl: leftCyl ? parseFloat(leftCyl) : null,
        left_axis: leftAxis ? parseFloat(leftAxis) : null,
        left_add: leftAdd ? parseFloat(leftAdd) : null,
        ipd_distance: ipdDistance ? parseFloat(ipdDistance) : null,
        ipd_near: ipdNear ? parseFloat(ipdNear) : null
      }
    }

    // Parse Attachments (if any future UI supports it)
    const attachmentIds = JSON.parse(formData.get('attachment_ids') || '[]')

    const payload = {
      patient_id: patientId,
      diagnosis,
      notes,
      doctor_notes: doctorNotes,
      diseases: selectedDiseases,
      medications: selectedMedications,
      eye_measurements: eyeMeasurements,
      attachment_ids: attachmentIds
    }

    const { data, error } = await supabase.rpc('create_full_visit', { payload })

    if (error) {
      console.error("RPC Transaction Error:", error)
      throw new Error(error.message)
    }

    revalidatePath(`/dashboard/patients/${patientId}`)
    revalidatePath('/dashboard/visits')
    revalidatePath('/dashboard/queue')
    revalidatePath('/dashboard')
    
    return { success: true, visitId: data.visit_id }
    
  } catch (error) {
    console.error("Visit Creation Failed:", error)
    return { error: error.message || 'حدث خطأ أثناء حفظ الزيارة.' }
  }
}

export async function updateFullVisitAction(visitId, patientId, formData) {
  const { supabase } = await requireAuth()

  const diagnosis = sanitizeInput(formData.get('diagnosis'))
  const notes = sanitizeInput(formData.get('notes'))
  const doctorNotes = sanitizeInput(formData.get('doctor_notes'))
  const clientUpdatedAt = formData.get('last_updated_at')

  const selectedDiseases = JSON.parse(formData.get('selected_diseases') || '[]')
  const selectedMedications = JSON.parse(formData.get('selected_medications') || '[]')

  console.log(`[UPDATE VISIT] Starting update for visit_id: ${visitId}, patient_id: ${patientId}`)

  try {
    // Concurrent Edit Check
    if (clientUpdatedAt) {
      const { data: currentVisit } = await supabase.from('visits').select('updated_at').eq('id', visitId).single()
      if (currentVisit && currentVisit.updated_at && currentVisit.updated_at !== clientUpdatedAt) {
        return { error: 'تم تعديل هذا السجل بواسطة جلسة أخرى. يرجى تحديث الصفحة.' }
      }
    }

    // Step 1: Update the Visit
    const { error: visitError } = await supabase
      .from('visits')
      .update({ diagnosis, notes, updated_at: new Date().toISOString() })
      .eq('id', visitId)

    if (visitError) throw new Error(`Visit update failed: ${visitError.message}`)

    // Step 2: Update Diseases
    await supabase.from('visit_diseases').delete().eq('visit_id', visitId)
    if (selectedDiseases.length > 0) {
      const diseaseLinks = selectedDiseases.map(diseaseId => ({
        visit_id: visitId,
        disease_id: diseaseId
      }))
      const { error: diseasesError } = await supabase.from('visit_diseases').insert(diseaseLinks)
      if (diseasesError) console.error("Warning: Failed to link diseases:", diseasesError.message)
    }

    // Step 3: Update Prescription
    const { data: existingRx } = await supabase.from('prescriptions').select('id').eq('visit_id', visitId).is('deleted_at', null).maybeSingle()

    if (selectedMedications.length > 0 || doctorNotes) {
      if (existingRx) {
        const { error: rxUpdateError } = await supabase
          .from('prescriptions')
          .update({ doctor_notes: doctorNotes, medications_data: selectedMedications })
          .eq('id', existingRx.id)
        if (rxUpdateError) console.error("Warning: Prescription update failed:", rxUpdateError.message)
      } else {
        const { error: rxInsertError } = await supabase
          .from('prescriptions')
          .insert({
            patient_id: patientId,
            visit_id: visitId,
            doctor_notes: doctorNotes,
            medications_data: selectedMedications
          })
        if (rxInsertError) console.error("Warning: Prescription creation failed:", rxInsertError.message)
      }
    } else if (existingRx) {
      await supabase.from('prescriptions').update({ doctor_notes: null, medications_data: [] }).eq('id', existingRx.id)
    }

    // Step 4: Update Eye Measurements
    const rightSph = formData.get('right_sph')
    const rightCyl = formData.get('right_cyl')
    const rightAxis = formData.get('right_axis')
    const rightAdd = formData.get('right_add')
    const leftSph = formData.get('left_sph')
    const leftCyl = formData.get('left_cyl')
    const leftAxis = formData.get('left_axis')
    const leftAdd = formData.get('left_add')
    const ipdDistance = formData.get('ipd_distance')
    const ipdNear = formData.get('ipd_near')

    const hasEyeData = rightSph || rightCyl || rightAxis || rightAdd || leftSph || leftCyl || leftAxis || leftAdd || ipdDistance || ipdNear
    const { data: existingEye } = await supabase.from('eye_measurements').select('id').eq('visit_id', visitId).maybeSingle()

    if (hasEyeData) {
      const eyeData = {
        right_sph: rightSph ? parseFloat(rightSph) : null,
        right_cyl: rightCyl ? parseFloat(rightCyl) : null,
        right_axis: rightAxis ? parseFloat(rightAxis) : null,
        right_add: rightAdd ? parseFloat(rightAdd) : null,
        left_sph: leftSph ? parseFloat(leftSph) : null,
        left_cyl: leftCyl ? parseFloat(leftCyl) : null,
        left_axis: leftAxis ? parseFloat(leftAxis) : null,
        left_add: leftAdd ? parseFloat(leftAdd) : null,
        ipd_distance: ipdDistance ? parseFloat(ipdDistance) : null,
        ipd_near: ipdNear ? parseFloat(ipdNear) : null
      }
      if (existingEye) {
        await supabase.from('eye_measurements').update(eyeData).eq('id', existingEye.id)
      } else {
        await supabase.from('eye_measurements').insert({ patient_id: patientId, visit_id: visitId, ...eyeData })
      }
    } else if (existingEye) {
       await supabase.from('eye_measurements').delete().eq('id', existingEye.id)
    }

    revalidatePath(`/dashboard/patients/${patientId}`)
    revalidatePath('/dashboard/visits')
    return { success: true, visitId }
    
  } catch (error) {
    console.error("Transaction Error:", error)
    return { error: error.message }
  }
}

export async function deleteVisitAction(visitId) {
  const { supabase } = await requireAuth()
  const now = new Date().toISOString()

  // Soft delete the visit
  const { error: visitError } = await supabase
    .from('visits')
    .update({ deleted_at: now })
    .eq('id', visitId)

  if (visitError) {
    return { error: visitError.message }
  }

  // Soft delete associated records
  await supabase.from('prescriptions').update({ deleted_at: now }).eq('visit_id', visitId)
  await supabase.from('eye_measurements').update({ deleted_at: now }).eq('visit_id', visitId)
  await supabase.from('visit_diseases').update({ deleted_at: now }).eq('visit_id', visitId)
  await supabase.from('attachments').update({ deleted_at: now }).eq('visit_id', visitId)
  await supabase.from('patient_notes').update({ deleted_at: now }).eq('visit_id', visitId)

  revalidatePath('/dashboard/visits')
  revalidatePath('/dashboard/patients') 
  revalidatePath('/dashboard/trash')
  return { success: true }
}

export async function restoreVisitAction(visitId) {
  const { supabase } = await requireAuth()

  // Restore the visit
  const { error: visitError } = await supabase
    .from('visits')
    .update({ deleted_at: null })
    .eq('id', visitId)

  if (visitError) {
    return { error: visitError.message }
  }

  // Restore associated records
  await supabase.from('prescriptions').update({ deleted_at: null }).eq('visit_id', visitId)
  await supabase.from('eye_measurements').update({ deleted_at: null }).eq('visit_id', visitId)
  await supabase.from('visit_diseases').update({ deleted_at: null }).eq('visit_id', visitId)
  await supabase.from('attachments').update({ deleted_at: null }).eq('visit_id', visitId)
  await supabase.from('patient_notes').update({ deleted_at: null }).eq('visit_id', visitId)

  revalidatePath('/dashboard/visits')
  revalidatePath('/dashboard/patients') 
  revalidatePath('/dashboard/trash')
  return { success: true }
}

export async function getVisitDetailsAction(visitId, patientId) {
  const { supabase } = await requireAuth()

  // Fetch full visit data including relations to avoid stale state
  const { data: visitData } = await supabase
    .from('visits')
    .select(`
      *,
      visit_diseases ( diseases (*) ),
      prescriptions (*),
      eye_measurements (*)
    `)
    .eq('id', visitId)
    .single()

  // Also fetch latest eye measurement for this patient as fallback
  const { data: eyeMeasurements } = await supabase
    .from('eye_measurements')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(1)

  return { 
    visitData: visitData || null,
    eyeMeasurement: eyeMeasurements?.[0] || null
  }
}

export async function createQuickVisitAction(patientId, newPatientData = null) {
  const { supabase } = await requireAuth()

  let finalPatientId = patientId

  // If no patientId, create the patient
  if (!finalPatientId && newPatientData) {
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .insert({ 
        full_name: newPatientData.name || '', 
        phone: newPatientData.phone || null 
      })
      .select()
      .single()
    
    if (patientError) return { error: `فشل إنشاء المريض: ${patientError.message}` }
    finalPatientId = patient.id
  }

  if (!finalPatientId) return { error: "يجب اختيار أو إضافة مريض أولاً." }

  // Create empty visit for today
  const { data: visit, error: visitError } = await supabase
    .from('visits')
    .insert({
      patient_id: finalPatientId,
      visit_date: new Date().toISOString()
    })
    .select('*, patients(id, full_name, phone)')
    .single()

  if (visitError) return { error: `فشل إنشاء الزيارة: ${visitError.message}` }

  revalidatePath('/dashboard/visits')
  revalidatePath('/dashboard/patients')
  
  return { success: true, visit, newPatient: newPatientData ? visit.patients : null }
}
