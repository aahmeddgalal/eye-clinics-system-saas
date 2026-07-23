import { createClient } from '@/utils/supabase/server'
import DiseasesClient from '@/components/diseases/DiseasesClient'

export const metadata = {
  title: 'Diseases Management | Eye Clinic',
}

export default async function DiseasesPage(props) {
  const searchParams = await props.searchParams;
  const query = searchParams?.q || '';

  const supabase = await createClient()

  let data = []
  let error = null

  if (query) {
    // Search by name
    const res = await supabase
      .from('diseases')
      .select('*')
      .is('deleted_at', null)
      .ilike('name', `%${query}%`)
      .order('name', { ascending: true })
    
    data = res.data
    error = res.error
  } else {
    const res = await supabase
      .from('diseases')
      .select('*')
      .is('deleted_at', null)
      .order('name', { ascending: true })
      
    data = res.data
    error = res.error
  }

  if (error) {
    console.error('Error fetching diseases:', error)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Diseases</h1>
        <p className="text-slate-500 text-sm mt-1">Manage the master list of diagnoses and diseases.</p>
      </div>

      <DiseasesClient initialDiseases={data || []} searchQuery={query} />
    </div>
  )
}
