import { createClient } from '@/utils/supabase/server'
import MedicationsClient from '@/components/medications/MedicationsClient'

export const metadata = {
  title: 'Medications Management | Eye Clinic',
}

export default async function MedicationsPage(props) {
  const searchParams = await props.searchParams;
  const query = searchParams?.q || '';

  const supabase = await createClient()

  let data = []
  let error = null

  if (query) {
    // Search by name
    const res = await supabase
      .from('medications')
      .select('*')
      .is('deleted_at', null)
      .neq('is_active', false)
      .ilike('name', `%${query}%`)
      .order('name', { ascending: true })
    
    data = res.data
    error = res.error
  } else {
    const res = await supabase
      .from('medications')
      .select('*')
      .is('deleted_at', null)
      .neq('is_active', false)
      .order('name', { ascending: true })
      
    data = res.data
    error = res.error
  }

  if (error) {
    console.error('Error fetching medications:', error)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Medications</h1>
        <p className="text-slate-500 text-sm mt-1">Manage the master list of medications and prescriptions.</p>
      </div>

      <MedicationsClient initialMedications={data || []} searchQuery={query} />
    </div>
  )
}
