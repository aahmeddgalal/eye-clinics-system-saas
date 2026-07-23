import { createClient } from '@/utils/supabase/server'
import QueueClient from '@/components/queue/QueueClient'
import { CalendarClock } from 'lucide-react'
import { getCairoTodayRange } from '@/utils/timezone'

export const metadata = {
  title: "قائمة اليوم | عيادة العيون",
}

export default async function QueuePage() {
  const supabase = await createClient()

  // Get today's start and end in Cairo timezone (UTC format)
  const { start: todayStart, end: todayEnd } = getCairoTodayRange()

  // Fetch queue and patients in parallel
  const [queueRes, patientsRes] = await Promise.all([
    supabase
      .from('todays_queue')
      .select('*, patients!inner(*)')
      .gte('scheduled_date', todayStart)
      .lte('scheduled_date', todayEnd)
      .is('patients.deleted_at', null)
      .order('status', { ascending: true })
      .order('scheduled_date', { ascending: true }),
      supabase
      .from('patients')
      .select('id, full_name, age, phone, visits(visit_date)')
      .is('deleted_at', null)
      .limit(50)
  ])

  const patients = (patientsRes.data || []).map(p => {
    const visits = p.visits || []
    const lastVisit = visits.length ? visits.sort((a,b) => new Date(b.visit_date) - new Date(a.visit_date))[0].visit_date : null
    return {
      id: p.id,
      full_name: p.full_name,
      age: p.age,
      phone: p.phone,
      last_visit: lastVisit
    }
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-[#1434A4]">
          <CalendarClock size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">قائمة اليوم</h1>
          <p className="text-slate-500 text-sm mt-1">إدارة سير المرضى وأوقات الانتظار بالعيادة.</p>
        </div>
      </div>

      <QueueClient 
        initialQueue={queueRes.data || []} 
        patients={patients} 
      />
    </div>
  )
}
