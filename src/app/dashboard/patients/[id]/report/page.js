import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import PatientReportClient from '@/components/patients/PatientReportClient'

export const metadata = {
  title: 'Medical History Report | Eye Clinic',
}

export default async function PatientReportPage(props) {
  const params = await props.params;
  const { id } = params;

  const supabase = await createClient()

  // Fetch patient with ALL nested relations needed for the timeline
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
      attachments (*),
      patient_notes (*)
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !patient) {
    notFound()
  }

  // Process data server-side
  const visits = [...(patient.visits || [])]
    .filter(v => v.deleted_at === null)
    .sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date))

  const attachments = [...(patient.attachments || [])]
    .filter(a => a.deleted_at === null)

  const patientNotes = [...(patient.patient_notes || [])]
    .filter(n => n.deleted_at === null)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return (
    <PatientReportClient 
      patient={patient} 
      visits={visits} 
      attachments={attachments} 
      patientNotes={patientNotes} 
    />
  )
}
