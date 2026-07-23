'use server'

import { createClient } from '@supabase/supabase-js'

// We use service role key here to ensure we have full access to all tables for backup/restore
// bypassing any RLS that might be in place.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const TABLES_TO_BACKUP = [
  'patients',
  'visits',
  'visit_diseases',
  'prescriptions',
  'eye_measurements',
  'medications',
  'diseases',
  'patient_notes',
  'attachments'
]

export async function exportBackupAction(lastBackupDate = null) {
  try {
    const backupData = {
      timestamp: new Date().toISOString(),
      is_incremental: !!lastBackupDate,
      data: {}
    }

    for (const table of TABLES_TO_BACKUP) {
      let query = supabase.from(table).select('*')
      
      // If incremental, only fetch records created or updated after lastBackupDate
      if (lastBackupDate) {
        // We use created_at because updated_at might not exist on all tables
        // If a table has updated_at, we should ideally use it, but for simplicity
        // and robust incremental backup, we'll try to fetch where created_at OR updated_at >= lastBackupDate
        // To avoid schema errors if updated_at is missing, we'll just fetch all for lookup tables
        // and filter by created_at for others. Actually, fetching all for a small clinic DB is very fast anyway.
        
        const { data: schemaData, error: schemaError } = await supabase.from(table).select('*').limit(1)
        if (schemaError) throw schemaError
        
        if (!schemaData || schemaData.length === 0) {
          backupData.data[table] = []
          continue
        }
        
        const hasUpdatedAt = 'updated_at' in schemaData[0]
        const hasCreatedAt = 'created_at' in schemaData[0]
        
        if (hasUpdatedAt) {
          query = query.gte('updated_at', lastBackupDate)
        } else if (hasCreatedAt) {
          query = query.gte('created_at', lastBackupDate)
        }
      }

      const { data, error } = await query
      if (error) throw error
      backupData.data[table] = data || []
    }

    return { success: true, backup: backupData }
  } catch (error) {
    console.error('Backup Error:', error)
    return { success: false, error: error.message }
  }
}

export async function importBackupAction(backupData) {
  try {
    if (!backupData || !backupData.data) {
      throw new Error('Invalid backup file structure.')
    }

    // We must restore in correct order to respect Foreign Keys
    // 1. Independent tables
    // 2. patients
    // 3. visits
    // 4. dependent tables

    const restoreOrder = [
      'diseases',
      'medications',
      'patients',
      'visits',
      'visit_diseases',
      'prescriptions',
      'eye_measurements',
      'patient_notes',
      'attachments'
    ]

    for (const table of restoreOrder) {
      const records = backupData.data[table]
      if (!records || records.length === 0) continue

      // Upsert records in chunks of 500
      const chunkSize = 500
      for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize)
        const { error } = await supabase.from(table).upsert(chunk, { onConflict: 'id' })
        if (error) {
          console.error(`Error importing ${table}:`, error)
          throw new Error(`Failed to import table ${table}: ${error.message}`)
        }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Import Error:', error)
    return { success: false, error: error.message }
  }
}
