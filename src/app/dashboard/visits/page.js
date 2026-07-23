import { createClient } from '@/utils/supabase/server'
import VisitsClient from '@/components/visits/VisitsClient'
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns'

export const metadata = {
  title: 'Visits | Eye Clinic',
}

export default async function VisitsPage(props) {
  const searchParams = await props.searchParams;
  const currentMonthStr = format(new Date(), 'yyyy-MM')
  const month = searchParams?.month || currentMonthStr

  let startStr, endStr
  try {
    const dateObj = parseISO(`${month}-01`)
    startStr = startOfMonth(dateObj).toISOString()
    endStr = endOfMonth(dateObj).toISOString()
  } catch(e) {
    const dateObj = new Date()
    startStr = startOfMonth(dateObj).toISOString()
    endStr = endOfMonth(dateObj).toISOString()
  }

  const supabase = await createClient()

  // Fetch visits for the selected month
  const { data: visits, error } = await supabase
    .from('visits')
    .select(`
      *, 
      patients(id, full_name),
      visit_diseases ( diseases (*) ),
      prescriptions (*),
      eye_measurements (*)
    `)
    .is('deleted_at', null)
    .gte('visit_date', startStr)
    .lte('visit_date', endStr)
    .order('visit_date', { ascending: false })

  const { data: patientsData } = await supabase
    .from('patients')
    .select('id, full_name, phone')
    .is('deleted_at', null)
    .order('full_name')

  if (error) {
    console.error('Error fetching visits:', error.message || JSON.stringify(error))
  }

  return (
    <VisitsClient 
      initialVisits={visits || []} 
      patientsCatalog={patientsData || []} 
      currentMonth={month}
    />
  )
}
