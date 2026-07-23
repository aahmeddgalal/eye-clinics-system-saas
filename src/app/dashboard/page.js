import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, Calendar, Activity, TrendingUp, Clock, AlertCircle, User, Plus } from 'lucide-react'
import { getCairoTodayRange } from '@/utils/timezone'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { start: todayStart, end: todayEnd } = getCairoTodayRange()
  const now = new Date().toISOString()

  // Fetch real data
  const [
    { count: patientsCount },
    { data: todaysQueue },
    { data: announcements }
  ] = await Promise.all([
    supabase.from('patients').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('todays_queue')
      .select('*, patients!inner(*)')
      .gte('scheduled_date', todayStart)
      .lte('scheduled_date', todayEnd)
      .is('patients.deleted_at', null),
    supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order('created_at', { ascending: false })
      .limit(3)
  ])

  const queueList = todaysQueue || []
  const waitingCount = queueList.filter(q => q.status === 'waiting').length
  const completedCount = queueList.filter(q => q.status === 'completed').length

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-in-out">
      
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Welcome back, <span className="text-[#1434A4]">Dr. Sabry</span>
          </h1>
          <p className="text-slate-500 mt-1">Here is what is happening in the clinic today.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/queue" className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm text-sm flex items-center gap-2">
            <Clock size={16} />
            View Schedule
          </Link>
          <Link href="/dashboard/patients" className="px-4 py-2 bg-[#1434A4] text-white rounded-lg font-medium hover:bg-[#102a83] transition-colors shadow-md text-sm flex items-center gap-2">
            <Activity size={16} />
            Patients Record
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Patients" 
          value={patientsCount || 0} 
          trend="Registered" 
          isPositive={null}
          icon={Users}
          color="blue"
        />
        <StatCard 
          title="Today's Appointments" 
          value={queueList.length} 
          trend={`${waitingCount} waiting`} 
          isPositive={waitingCount > 0 ? false : null}
          icon={Calendar}
          color="emerald"
        />
        <StatCard 
          title="Completed Today" 
          value={completedCount} 
          trend="Finished visits" 
          isPositive={completedCount > 0 ? true : null}
          icon={Activity}
          color="indigo"
        />
        <StatCard 
          title="System Status" 
          value="Online" 
          trend="All systems operational" 
          isPositive={true}
          icon={AlertCircle}
          color="amber"
        />
      </div>

      {/* Bottom Section - Lists/Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Queue Overview */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">قائمة اليوم</h2>
            <Link href="/dashboard/queue" className="text-sm font-semibold text-[#1434A4] hover:underline">عرض الكل</Link>
          </div>
          
          <div className="space-y-4">
            {queueList.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">لا يوجد مرضى في قائمة الانتظار اليوم.</div>
            ) : (
              queueList.slice(0, 5).map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-50 hover:bg-[#F8FAFC] transition-colors group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                      #{index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{item.patients?.full_name || 'غير معروف'}</h3>
                      <p className="text-sm text-slate-500">مجدول • {new Date(item.scheduled_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>
                  <div className="text-end flex items-center justify-end gap-3">
                    <span className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                      item.status === 'in_progress' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {item.status === 'completed' ? 'مكتمل' : item.status === 'in_progress' ? 'جاري الكشف' : 'في الانتظار'}
                    </span>
                    <div className="w-px h-5 bg-slate-200 hidden sm:block"></div>
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/dashboard/patients/${item.patient_id}/new-visit`}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1"
                        title="زيارة جديدة"
                      >
                        <Plus size={18} />
                      </Link>
                      <Link
                        href={`/dashboard/patients/${item.patient_id}`}
                        className="p-2 text-slate-400 hover:text-[#1434A4] hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                        title="الملف الطبي"
                      >
                        <User size={18} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Announcements</h2>
            <Link href="/dashboard/announcements" className="text-sm font-semibold text-[#1434A4] hover:underline">Manage</Link>
          </div>
          <div className="space-y-6">
            {(!announcements || announcements.length === 0) ? (
              <div className="text-center py-8 text-slate-500 text-sm">No active announcements.</div>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} className="relative ps-6 border-s-2 border-[#1434A4]">
                  <span className="absolute -start-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-[#1434A4]"></span>
                  <p className="text-sm text-slate-500 mb-1">{new Date(ann.created_at).toLocaleDateString()}</p>
                  <h4 className="text-sm font-semibold text-slate-800">{ann.title}</h4>
                  <p className="text-sm text-slate-600 mt-1">{ann.content}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

function StatCard({ title, value, trend, isPositive, icon: Icon, color }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600',
  }
  
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${colorMap[color]}`}>
          <Icon size={24} strokeWidth={2} />
        </div>
      </div>
      <div className="mt-4 flex items-center text-sm">
        {isPositive !== null && (
          <TrendingUp className={`me-1.5 h-4 w-4 ${isPositive ? 'text-emerald-500' : 'text-rose-500 rotate-180'}`} />
        )}
        <span className={
          isPositive === true ? 'text-emerald-600 font-medium' : 
          isPositive === false ? 'text-rose-600 font-medium' : 
          'text-slate-500 font-medium'
        }>
          {trend}
        </span>
      </div>
    </div>
  )
}
