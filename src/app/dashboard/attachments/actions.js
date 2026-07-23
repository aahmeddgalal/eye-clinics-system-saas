'use server'

import { createClient, requireAuth } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAttachmentAction(patientId, fileUrl, fileType, visitId = null, description = null) {
  const { supabase } = await requireAuth()

  const { error } = await supabase.from('attachments').insert({
    patient_id: patientId,
    file_url: fileUrl,
    file_type: fileType,
    visit_id: visitId,
    description: description,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/patients/${patientId}`)
  return { success: true }
}

export async function deleteAttachmentAction(attachmentId, fileUrl, patientId) {
  const { supabase } = await requireAuth()

  // Soft delete from DB
  const { error: dbError } = await supabase
    .from('attachments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', attachmentId)

  if (dbError) {
    return { error: dbError.message }
  }

  revalidatePath(`/dashboard/patients/${patientId}`)
  return { success: true }
}
