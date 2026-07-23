'use server'

import { createClient, requireAuth } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createMedicationAction(formData) {
  const { supabase } = await requireAuth()

  const data = {
    name: formData.get('name'),
    description: formData.get('description'),
  }

  const { error } = await supabase.from('medications').insert(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/medications')
  return { success: true }
}

export async function updateMedicationAction(id, formData) {
  const { supabase } = await requireAuth()

  const data = {
    name: formData.get('name'),
    description: formData.get('description'),
  }

  const { error } = await supabase.from('medications').update(data).eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/medications')
  return { success: true }
}

export async function deleteMedicationAction(id) {
  const { supabase } = await requireAuth()

  const { error } = await supabase.from('medications').update({ is_active: false }).eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/medications')
  return { success: true }
}

export async function createMedicationInlineAction(name) {
  const { supabase } = await requireAuth()

  const { data, error } = await supabase
    .from('medications')
    .insert({ name })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/medications')
  return { success: true, data }
}
