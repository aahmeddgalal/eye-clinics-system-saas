'use server'

import { createClient, requireAuth } from '@/utils/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function restoreRecordAction(table, id) {
  const { supabase } = await requireAuth()

  // 1. Enforce Patient Restoration
  const dependentTables = ['visits', 'prescriptions', 'eye_measurements', 'attachments', 'patient_notes']
  
  if (dependentTables.includes(table)) {
    // Fetch the patient_id associated with this record
    const { data: record } = await supabase.from(table).select('patient_id').eq('id', id).single()
    
    if (record && record.patient_id) {
      // Check if the patient is deleted
      const { data: patient } = await supabase
        .from('patients')
        .select('id, full_name, deleted_at')
        .eq('id', record.patient_id)
        .single()
        
      if (patient && patient.deleted_at !== null) {
        // Patient is deleted, return conflict error
        return { 
          success: false, 
          error: 'يجب استرجاع المريض أولاً',
          requiresPatientRestore: true,
          patientId: patient.id,
          patientName: patient.full_name
        }
      }
    }
  }

  // 1.5 Enforce Visit Restoration
  const visitDependentTables = ['prescriptions', 'attachments', 'patient_notes', 'eye_measurements', 'visit_diseases']
  if (visitDependentTables.includes(table)) {
    const { data: record } = await supabase.from(table).select('visit_id').eq('id', id).single()
    if (record && record.visit_id) {
      // Check if the visit is deleted
      const { data: visit } = await supabase
        .from('visits')
        .select('id, visit_date, diagnosis, deleted_at')
        .eq('id', record.visit_id)
        .single()
        
      if (visit && visit.deleted_at !== null) {
        return {
          success: false,
          error: 'هذا العنصر مرتبط بزيارة محذوفة. يجب استرجاع الزيارة أولاً.',
          requiresVisitRestore: true,
          visitId: visit.id,
          visitDate: visit.visit_date,
          visitDiagnosis: visit.diagnosis || 'بدون عنوان'
        }
      }
    }
  }

  // 2. Restore the record

  const { error } = await supabase
    .from(table)
    .update({ deleted_at: null })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  // 3. Cascade Restore if Patient
  if (table === 'patients') {
    await supabase.from('visits').update({ deleted_at: null }).eq('patient_id', id)
    await supabase.from('prescriptions').update({ deleted_at: null }).eq('patient_id', id)
    await supabase.from('eye_measurements').update({ deleted_at: null }).eq('patient_id', id)
    await supabase.from('patient_notes').update({ deleted_at: null }).eq('patient_id', id)
    await supabase.from('attachments').update({ deleted_at: null }).eq('patient_id', id)
  }

  // 4. Cascade Restore if Visit
  if (table === 'visits') {
    await supabase.from('prescriptions').update({ deleted_at: null }).eq('visit_id', id)
    await supabase.from('attachments').update({ deleted_at: null }).eq('visit_id', id)
    await supabase.from('patient_notes').update({ deleted_at: null }).eq('visit_id', id)
    await supabase.from('eye_measurements').update({ deleted_at: null }).eq('visit_id', id)
    await supabase.from('visit_diseases').update({ deleted_at: null }).eq('visit_id', id)
  }

  revalidatePath('/dashboard/trash')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function permanentDeleteAction(table, id) {
  const { supabase } = await requireAuth()

  // Use service role key to bypass RLS for hard deletes if available
  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseAdmin = createSupabaseAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL, adminKey)

  if (table === 'attachments') {
    // Fetch file_url first
    const { data: attachment } = await supabase.from('attachments').select('file_url').eq('id', id).single()
    if (attachment && attachment.file_url) {
      const urlParts = attachment.file_url.split('patient-files/')
      if (urlParts.length === 2) {
        const filePath = decodeURIComponent(urlParts[1])
        await supabaseAdmin.storage.from('patient-files').remove([filePath])
      }
    }
  }

  const { error, count } = await supabaseAdmin
    .from(table)
    .delete({ count: 'exact' })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  if (count === 0) {
    return { error: 'تعذر الحذف النهائي من قاعدة البيانات. يرجى مراجعة الصلاحيات (RLS) أو قد يكون الملف محذوفاً مسبقاً.' }
  }

  revalidatePath('/dashboard/trash')
  return { success: true }
}

export async function cleanupTrashAction() {
  const { supabase } = await requireAuth()
  
  // Call the Postgres function we defined in soft_delete_migration.sql
  const { error } = await supabase.rpc('cleanup_trash')
  
  if (error) {
    console.error("Auto-cleanup failed:", error.message)
    return { error: error.message }
  }
  
  return { success: true }
}


export async function emptyTrashAction() {
  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseAdmin = createSupabaseAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL, adminKey)

  // 1. Delete all attachments files from storage
  const { data: attachments } = await supabaseAdmin.from('attachments').select('file_url').not('deleted_at', 'is', null)
  
  if (attachments && attachments.length > 0) {
    const filePaths = attachments
      .filter(a => a.file_url)
      .map(a => {
        const parts = a.file_url.split('patient-files/')
        return parts.length === 2 ? decodeURIComponent(parts[1]) : null
      })
      .filter(Boolean)
      
    if (filePaths.length > 0) {
      await supabaseAdmin.storage.from('patient-files').remove(filePaths)
    }
  }

  // 2. Delete rows from all tables (must respect foreign keys, so delete children first)
  const tables = ['attachments', 'patient_notes', 'eye_measurements', 'prescriptions', 'visit_diseases', 'visits', 'patients', 'diseases', 'medications']
  
  for (const table of tables) {
    await supabaseAdmin.from(table).delete().not('deleted_at', 'is', null)
  }

  revalidatePath('/dashboard/trash')
  revalidatePath('/dashboard')
  return { success: true }
}
