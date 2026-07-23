import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import UploaderComponent from '@/components/patients/UploaderComponent'
import AttachmentsGallery from '@/components/patients/AttachmentsGallery'
import PatientVisitsList from '@/components/patients/PatientVisitsList'
import PatientPrescriptionsList from '@/components/patients/PatientPrescriptionsList'
import PatientEyeMeasurementsList from '@/components/patients/PatientEyeMeasurementsList'
import EditPatientProfile from '@/components/patients/EditPatientProfile'
import DeletePatientButton from '@/components/patients/DeletePatientButton'
import PatientNotesList from '@/components/patients/PatientNotesList'
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Calendar,
  Activity,
  Pill,
  Eye,
  Paperclip,
  Clock,
  FileText
} from 'lucide-react'

export const metadata = {
  title: 'Patient Profile | Eye Clinic',
}

export default async function PatientProfilePage(props) {
  // In Next.js 15, params are asynchronous
  const params = await props.params;
  const { id } = params;

  const supabase = await createClient()

  const { data: patient, error } = await supabase
    .from('patients')
    .select(`
      *,
      visits (
        *,
        visit_diseases ( diseases (*) ),
        prescriptions (*),
        eye_measurements (*)
      ),
      prescriptions (
        *,
        visits (diagnosis, visit_date, visit_diseases (diseases (*)))
      ),
      eye_measurements (*),
      attachments (*),
      patient_notes (*)
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !patient) {
    notFound()
  }

  // Fetch medications and diseases for the prescription editor
  const { data: medications } = await supabase.from('medications').select('*').order('name')
  const { data: diseases } = await supabase.from('diseases').select('*').order('name')

  // Sort and filter relations by date descending
  const visits = [...(patient.visits || [])]
    .filter(v => v.deleted_at === null)
    .map(v => ({
      ...v,
      prescriptions: (v.prescriptions || []).filter(p => p.deleted_at === null),
      eye_measurements: (v.eye_measurements || []).filter(em => em.deleted_at === null),
      visit_diseases: v.visit_diseases || []
    }))
    .sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date))
  const prescriptions = [...(patient.prescriptions || [])].filter(p => p.deleted_at === null).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const eyeMeasurements = [...(patient.eye_measurements || [])].filter(em => em.deleted_at === null).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const attachments = [...(patient.attachments || [])].filter(a => a.deleted_at === null).sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at))
  const patientNotes = [...(patient.patient_notes || [])].filter(n => n.deleted_at === null).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">

      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/patients"
            className="p-2 text-slate-400 hover:text-[#1434A4] hover:bg-blue-50 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Patient Profile</h1>
            <p className="text-slate-500 text-sm mt-1">Detailed overview of clinical status and medical history.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/patients/${patient.id}/report`}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors font-medium text-sm"
          >
            <FileText size={18} />
            Patient Report
          </Link>
          <EditPatientProfile patient={patient} />
          <DeletePatientButton patientId={patient.id} />
        </div>
      </div>

      {/* 1. Patient Header (Name, Age, Phone) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="w-24 h-24 rounded-2xl bg-[#1434A4] text-white shadow-lg flex items-center justify-center font-bold text-4xl shrink-0">
          {patient.full_name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">{patient.full_name}</h2>

          <div className="flex flex-wrap items-center gap-y-3 gap-x-6">
            <div className="flex items-center gap-2 text-slate-600">
              <User size={18} className="text-[#1434A4]" />
              <span className="font-medium" dir="ltr">
                {patient.age ? `${patient.age} years` : 'Age not registered'} • {patient.gender === 'Male' ? 'Male' : patient.gender === 'Female' ? 'Female' : 'Not specified'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-600">
              <Phone size={18} className="text-[#1434A4]" />
              <span className="font-medium" dir="ltr">{patient.phone || 'No phone'}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-600">
              <MapPin size={18} className="text-[#1434A4]" />
              <span className="font-medium">{patient.address || 'No address'}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-600">
              <Calendar size={18} className="text-[#1434A4]" />
              <span className="font-medium">Registered: {new Date(patient.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl text-center shrink-0">
          <p className="text-xs text-slate-500 font-semibold uppercase mb-1">File No.</p>
          <p className="text-lg font-bold text-[#1434A4]" dir="ltr">#{patient.id.split('-')[0].toUpperCase()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Content (Visits, Rx, Attachments) */}
        <div className="lg:col-span-2 space-y-6">

          {/* 3. Visits History */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-[#1434A4] rounded-lg">
                  <Clock size={20} />
                </div>
                <h3 className="font-bold text-slate-900 text-xl">Clinical Visits</h3>
              </div>
              <Link href={`/dashboard/patients/${patient.id}/new-visit`} className="px-4 py-2 bg-[#1434A4] hover:bg-[#102a83] text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                Add Visit
              </Link>
            </div>

            <PatientVisitsList visits={visits} />
          </div>

          {/* Eye Measurements */}
          <PatientEyeMeasurementsList patient={patient} eyeMeasurements={eyeMeasurements} />

          {/* 4. Prescriptions */}
          <PatientPrescriptionsList patient={patient} prescriptions={prescriptions} medications={medications || []} diseases={diseases || []} />

          {/* 5. Attachments */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-[#1434A4] rounded-lg">
                  <Paperclip size={20} />
                </div>
                <h3 className="font-bold text-slate-900 text-xl">Attachments & Scans</h3>
              </div>
              <UploaderComponent patientId={patient.id} visits={visits} />
            </div>

            <div className="mt-4">
              <AttachmentsGallery attachments={attachments} patientId={patient.id} visits={visits} />
            </div>
          </div>

        </div>

        {/* Sidebar Content (Medical History & Measurements) */}
        <div className="lg:col-span-1 space-y-6">

          <PatientNotesList patientId={patient.id} notes={patientNotes} visits={visits} />

          {/* 2. Medical History (General) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 bg-[#1434A4] h-full"></div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 text-[#1434A4] rounded-lg">
                <FileText size={20} />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Medical History</h3>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              {patient.notes ? (
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">{patient.notes}</p>
              ) : (
                <p className="text-sm text-slate-400 italic">No previous medical notes or history recorded.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
