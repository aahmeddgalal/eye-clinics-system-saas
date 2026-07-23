'use server'

import { createClient, requireAuth } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addToQueueAction(formData) {
  const { supabase } = await requireAuth()

  const patient_id = formData.get('patient_id')
  
  if (!patient_id) {
    return { error: 'Please select a patient.' }
  }

  const { error } = await supabase.from('todays_queue').insert({
    patient_id,
    scheduled_date: new Date().toISOString(),
    status: 'waiting'
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/queue')
  // Also revalidate the main dashboard since it shows a queue summary
  revalidatePath('/dashboard') 
  return { success: true }
}

export async function updateQueueStatusAction(queueId, newStatus) {
  const { supabase } = await requireAuth()

  const { error } = await supabase
    .from('todays_queue')
    .update({ status: newStatus })
    .eq('id', queueId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/queue')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function removeFromQueueAction(queueId) {
  const { supabase } = await requireAuth()

  const { error } = await supabase
    .from('todays_queue')
    .delete()
    .eq('id', queueId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/queue')
  revalidatePath('/dashboard')
  return { success: true }
}
