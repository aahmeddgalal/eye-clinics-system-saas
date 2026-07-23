import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Stethoscope } from 'lucide-react'
import NewVisitForm from '@/components/visits/NewVisitForm'

export const metadata = {
  title: 'تعديل الزيارة | دكتور صبري عياد',
}

export default async function EditVisitPage(props) {
  const params = await props.params;
  const { id, visitId } = params;

  const supabase = await createClient()

  // Parallel data fetching
  const [patientRes, diseasesRes, medicationsRes, visitRes] = await Promise.all([
    supabase.from('patients').select('id, full_name').eq('id', id).is('deleted_at', null).single(),
    supabase.from('diseases').select('*').is('deleted_at', null).order('name'),
    supabase.from('medications').select('*').is('deleted_at', null).order('name'),
    supabase.from('visits').select(`
      *,
      visit_diseases ( diseases (*) ),
      prescriptions (*),
      eye_measurements (*)
    `).eq('id', visitId).is('deleted_at', null).single()
  ])

  if (patientRes.error || !patientRes.data || visitRes.error || !visitRes.data) {
    notFound()
  }

  const patient = patientRes.data
  const diseases = diseasesRes.data || []
  const medications = medicationsRes.data || []
  const visit = visitRes.data

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* Header Navigation */}
      <div className="flex items-center gap-4">
        <Link 
          href={`/dashboard/patients/${id}`} 
          className="p-2 text-slate-400 hover:text-[#1434A4] hover:bg-blue-50 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-[#1434A4]">
            <Stethoscope size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">تعديل تفاصيل الزيارة</h1>
            <p className="text-slate-500 text-sm mt-1">
              تعديل استشارة لـ  <span className="font-semibold text-slate-700">{patient.full_name}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <NewVisitForm 
          patientId={patient.id} 
          diseasesCatalog={diseases} 
          medicationsCatalog={medications} 
          initialVisit={visit}
        />
      </div>

    </div>
  )
}
