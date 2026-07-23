'use server'

import { createClient, requireAuth } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createDiseaseAction(formData) {
  const { supabase } = await requireAuth()

  const data = {
    name: formData.get('name'),
    description: formData.get('description'),
  }

  const { error } = await supabase.from('diseases').insert(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/diseases')
  return { success: true }
}

export async function updateDiseaseAction(id, formData) {
  const { supabase } = await requireAuth()

  const data = {
    name: formData.get('name'),
    description: formData.get('description'),
  }

  const { error } = await supabase.from('diseases').update(data).eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/diseases')
  return { success: true }
}

export async function deleteDiseaseAction(id) {
  const { supabase } = await requireAuth()

  const { error } = await supabase.from('diseases').update({ deleted_at: new Date().toISOString() }).eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/diseases')
  return { success: true }
}

export async function createDiseaseInlineAction(name) {
  const { supabase } = await requireAuth()

  const { data, error } = await supabase
    .from('diseases')
    .insert({ name })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/diseases')
  return { success: true, data }
}
