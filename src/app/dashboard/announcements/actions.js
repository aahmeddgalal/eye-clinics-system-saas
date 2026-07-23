'use server'

import { createClient, requireAuth } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAnnouncementAction(formData) {
  const { supabase } = await requireAuth()

  const title = formData.get('title')
  const content = formData.get('content') || null
  const is_active = formData.get('is_active') === 'on'
  const duration = formData.get('duration')
  const customStart = formData.get('custom_start')
  const customEnd = formData.get('custom_end')

  if (!title) {
    return { error: 'عنوان الإعلان مطلوب' }
  }

  let start_date = null
  let end_date = null

  if (duration === 'custom') {
    start_date = customStart ? new Date(customStart).toISOString() : null
    end_date = customEnd ? new Date(customEnd).toISOString() : null
  } else if (duration === '3_days' || duration === '7_days' || duration === '30_days') {
    const days = parseInt(duration.split('_')[0])
    const now = new Date()
    start_date = now.toISOString()
    const end = new Date(now)
    end.setDate(now.getDate() + days)
    end_date = end.toISOString()
  }

  // If this new announcement is active, deactivate all others first
  if (is_active) {
    await supabase.from('announcements').update({ is_active: false }).neq('id', 0)
  }

  const { error } = await supabase
    .from('announcements')
    .insert([{ title, content, is_active, start_date, end_date }])

  if (error) {
    console.error('Error creating announcement:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/announcements')
  return { success: true }
}

export async function deleteAnnouncementAction(id) {
  const { supabase } = await requireAuth()

  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting announcement:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/announcements')
  return { success: true }
}

export async function toggleAnnouncementStatusAction(id, is_active) {
  const { supabase } = await requireAuth()

  // If setting to active, deactivate all others first
  if (is_active) {
    await supabase.from('announcements').update({ is_active: false }).neq('id', 0)
  }

  const { error } = await supabase
    .from('announcements')
    .update({ is_active })
    .eq('id', id)

  if (error) {
    console.error('Error updating announcement status:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/announcements')
  return { success: true }
}
