import { createClient } from '@/utils/supabase/server'
import TrashClient from '@/components/trash/TrashClient'
import { Trash2 } from 'lucide-react'

export const metadata = {
  title: 'Trash | Eye Clinic',
}

export default async function TrashPage() {
  const supabase = await createClient()

  // Fetch soft-deleted records
  const [patientsRes, visitsRes, prescriptionsRes, attachmentsRes, diseasesRes, medicationsRes, eyeRes] = await Promise.all([
    supabase.from('patients').select('id, full_name, deleted_at').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
    supabase.from('visits').select('id, diagnosis, deleted_at, patients(full_name)').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
    supabase.from('prescriptions').select('id, doctor_notes, deleted_at, patients(full_name), visits(visit_date)').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
    supabase.from('attachments').select('id, file_url, file_type, deleted_at, patients(full_name)').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
    supabase.from('diseases').select('id, name, deleted_at, visit_diseases(id)').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
    supabase.from('medications').select('id, name, deleted_at').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
    supabase.from('eye_measurements').select('id, right_sph, left_sph, deleted_at, patients(full_name)').not('deleted_at', 'is', null).order('deleted_at', { ascending: false })
  ])

  const trashItems = {
    patients: patientsRes.data || [],
    visits: visitsRes.data || [],
    prescriptions: prescriptionsRes.data || [],
    attachments: attachmentsRes.data || [],
    diseases: diseasesRes.data || [],
    medications: medicationsRes.data || [],
    eye_measurements: eyeRes.data || []
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between bg-rose-50 border border-rose-100 p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
            <Trash2 size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-rose-900">Trash</h1>
            <p className="text-rose-700 text-sm mt-1">Deleted items will stay here for 7 days before permanent deletion.</p>
          </div>
        </div>
      </div>

      <TrashClient initialItems={trashItems} />
    </div>
  )
}
