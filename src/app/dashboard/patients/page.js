import { createClient } from '@/utils/supabase/server'
import PatientsClient from '@/components/patients/PatientsClient'
import { startOfMonth, endOfMonth } from 'date-fns'

export const metadata = {
  title: 'Patient Management | Eye Clinic',
}

export default async function PatientsPage(props) {
  const searchParams = await props.searchParams;
  const query = searchParams?.q || '';

  const supabase = await createClient()

  let data = []
  let error = null
  let stats = { total: 0, newThisMonth: 0 }

  const now = new Date()
  const monthStart = startOfMonth(now).toISOString()
  const monthEnd = endOfMonth(now).toISOString()

  if (!query) {
    const [totalRes, monthRes, recentRes] = await Promise.all([
      supabase.from('patients').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('patients').select('*', { count: 'exact', head: true }).is('deleted_at', null).gte('created_at', monthStart).lte('created_at', monthEnd),
      supabase.from('patients').select('*').is('deleted_at', null).order('updated_at', { ascending: false }).limit(10)
    ])
    stats.total = totalRes.count || 0
    stats.newThisMonth = monthRes.count || 0
    data = recentRes.data || []
    if (recentRes.error) error = recentRes.error
  } else {
    const res = await supabase
      .from('patients')
      .select('*')
      .is('deleted_at', null)
      .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('updated_at', { ascending: false })
      .limit(50)
    
    data = res.data || []
    error = res.error
  }

  if (error) {
    console.error('Error fetching patients:', error.message || error)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
        <p className="text-slate-500 text-sm mt-1">Manage patient records and medical history.</p>
      </div>

      <PatientsClient 
        initialPatients={data} 
        searchQuery={query}
        stats={stats}
      />
    </div>
  )
}
