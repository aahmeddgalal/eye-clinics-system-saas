'use client'

import { Printer, ArrowLeft, Calendar, FileText, Pill, Eye, Paperclip, Activity, User, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'
import { formatCairoDate } from '@/utils/timezone'
import SecureAttachment from './SecureAttachment'

export default function PatientReportClient({ patient, visits, attachments, patientNotes }) {
  const handlePrint = () => {
    window.print()
  }

  // Calculate stats
  const totalVisits = visits.length
  const firstVisit = visits.length > 0 ? visits[visits.length - 1].visit_date : null
  const lastVisit = visits.length > 0 ? visits[0].visit_date : null

  // Pre-process associations so we can extract unassigned items early
  const usedNoteIds = new Set()

  const processedVisits = visits.map((visit) => {
    const visitDateStr = new Date(visit.visit_date).toDateString()
    
    const vAttachments = attachments.filter(a => {
      // Strict match: only assign to visit if visit_id explicitly matches
      return a.visit_id === visit.id
    })
    
    const vNotes = patientNotes.filter(n => {
      // Strict match: only assign to visit if visit_id explicitly matches
      return n.visit_id === visit.id
    })

    return { ...visit, vAttachments, vNotes }
  })

  // Unassigned attachments are those with no visit_id
  const unassignedAttachments = attachments.filter(a => !a.visit_id)
  
  // Unassigned notes are those with no visit_id
  const unassignedNotes = patientNotes.filter(n => !n.visit_id)

  return (
    <div className="max-w-5xl mx-auto pb-16 animate-in fade-in duration-500 print:max-w-none print:pb-0 print:bg-white print:text-black">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4; margin: 1.5cm; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          footer, header, aside, .print-hidden-force { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; }
        }
      `}} />
      
      {/* Non-printable Header Actions */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <Link 
          href={`/dashboard/patients/${patient.id}`}
          className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors font-semibold shadow-sm"
        >
          <ArrowLeft size={18} /> Back to Patient Profile
        </Link>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#1434A4] text-white hover:bg-blue-800 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 font-bold"
        >
          <Printer size={20} /> Print Full Report
        </button>
      </div>

      {/* Report Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12 print:shadow-none print:border-0 print:p-0">
        
        {/* Report Header (Printable) */}
        <div className="border-b-2 border-slate-200 pb-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 print:border-slate-300 print:mb-4 print:pb-4">
          <div className="text-center md:text-right">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{patient.full_name}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-slate-600">
              <span className="flex items-center gap-2" dir="ltr"><User size={16} /> {patient.age ? `${patient.age} years` : 'Age not recorded'} • {patient.gender === 'Male' ? 'Male' : patient.gender === 'Female' ? 'Female' : 'Not specified'}</span>
              {patient.phone && <span className="flex items-center gap-2" dir="ltr"><Phone size={16} /> {patient.phone}</span>}
              {patient.address && <span className="flex items-center gap-2"><MapPin size={16} /> {patient.address}</span>}
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 min-w-[200px] text-center print:bg-slate-50">
            <h2 className="text-lg font-bold text-[#1434A4] mb-2">Medical History Summary</h2>
            <div className="text-sm text-slate-600 space-y-1">
              <p>Total Visits: <strong>{totalVisits}</strong></p>
              {firstVisit && <p>First Visit: {new Date(firstVisit).toLocaleDateString('en-US')}</p>}
              {lastVisit && <p>Last Visit: {new Date(lastVisit).toLocaleDateString('en-US')}</p>}
            </div>
          </div>
        </div>

        {/* Uncategorized Items (Now at the top) */}
        {(patient.notes || unassignedNotes.length > 0 || unassignedAttachments.length > 0) && (
          <div className="mb-12 pb-8 border-b-2 border-slate-100 break-inside-avoid print:mb-4 print:pb-4">
            <h3 className="text-xl font-bold text-[#1434A4] mb-6 print:mb-3 flex items-center gap-2">
              <FileText size={24} /> General Records & Medical History
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {(patient.notes || unassignedNotes.length > 0) && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-4">Medical History and General Notes</h4>
                  <div className="space-y-3">
                    {patient.notes && (
                      <div className="text-sm bg-blue-50 p-4 rounded-xl border border-blue-100 print:bg-blue-50">
                        <div className="text-xs text-blue-700/60 mb-1">Primary Medical History</div>
                        <div className="text-blue-900 font-medium whitespace-pre-wrap leading-relaxed">{patient.notes}</div>
                      </div>
                    )}
                    {unassignedNotes.map(n => (
                      <div key={n.id} className="text-sm bg-amber-50 p-4 rounded-xl border border-amber-100 print:bg-amber-50">
                        <div className="text-xs text-amber-700/60 mb-1">{formatCairoDate(n.created_at)}</div>
                        <div className="text-amber-900 font-medium whitespace-pre-wrap">{n.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {unassignedAttachments.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-4">Other Attachments (Unassigned to visit)</h4>
                  <div className="flex flex-col gap-4">
                    {unassignedAttachments.map(a => {
                      const isImage = a.file_type === 'Image'
                      return (
                        <div key={a.id} className="border border-slate-200 rounded-lg p-3 print:border-slate-300 break-inside-avoid bg-slate-50">
                          <div className="font-semibold text-slate-800 text-sm mb-1">
                            {a.description || (isImage ? 'Attached Image' : 'PDF Document')}
                          </div>
                          <div className="text-xs text-slate-500 mb-2">{formatCairoDate(a.uploaded_at)}</div>
                          <SecureAttachment 
                            fileUrl={a.file_url} 
                            fileType={a.file_type} 
                            description={a.description} 
                            className={isImage ? "w-full max-h-[500px] object-contain rounded bg-white" : "text-[#1434A4] underline text-sm font-bold flex items-center gap-1"} 
                            renderAsLink={!isImage} 
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timeline Content */}
        <div className="space-y-12 print:space-y-4">
          {processedVisits.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No visit history for this patient.</div>
          ) : (
            processedVisits.map((visit, index) => {
              const diseases = visit.visit_diseases?.map(vd => vd.diseases?.name).filter(Boolean) || []
              const prescriptions = visit.prescriptions?.filter(p => p.deleted_at === null) || []
              const eyeMeasurements = visit.eye_measurements?.filter(em => em.deleted_at === null) || []
              const vAttachments = visit.vAttachments || []
              const vNotes = visit.vNotes || []

              return (
                <div key={visit.id} className="break-inside-avoid border border-slate-200 rounded-xl overflow-hidden print:border-slate-300">
                  {/* Visit Header */}
                  <div className="bg-slate-50 px-6 py-4 print:py-2 print:px-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:bg-slate-50 print:border-slate-300">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 text-[#1434A4] rounded-lg">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">
                          {visit.diagnosis || 'Medical Visit (No Diagnosis)'}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {formatCairoDate(visit.visit_date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-[#1434A4] bg-white px-3 py-1 rounded-full border border-blue-100 print:bg-white">
                      Visit #{totalVisits - index}
                    </div>
                  </div>

                  {/* Visit Body */}
                  <div className="p-6 print:p-4 space-y-6 print:space-y-3">
                    
                    {/* Diseases & Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-6 print:gap-4">
                      {diseases.length > 0 && (
                        <div>
                          <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-2">
                            <Activity size={18} className="text-[#1434A4]" /> Diagnosed Diseases
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {diseases.map((d, i) => (
                              <span key={i} className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100 print:bg-red-50">
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {visit.notes && (
                        <div className={diseases.length === 0 ? 'md:col-span-2' : ''}>
                          <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-2">
                            <FileText size={18} className="text-[#1434A4]" /> Visit Notes
                          </h4>
                          <p className="text-slate-600 bg-slate-50 p-3 rounded-lg text-sm whitespace-pre-wrap print:bg-slate-50">
                            {visit.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Prescriptions */}
                    {prescriptions.length > 0 && (
                      <div className="border-t border-slate-100 pt-6 print:pt-3 print:border-slate-200">
                        <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4 print:mb-2">
                          <Pill size={18} className="text-[#1434A4]" /> Medical Prescription
                        </h4>
                        {prescriptions.map(rx => (
                          <div key={rx.id} className="space-y-4 print:space-y-2">
                            {rx.medications_data?.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-2 gap-3 print:gap-2">
                                {rx.medications_data.map((med, idx) => (
                                  <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 print:bg-slate-50">
                                    <div className="font-bold text-slate-900">{med.name}</div>
                                    {/* Screen View */}
                                    <div className="text-sm text-slate-600 mt-2 space-y-1 print:hidden">
                                      {med.dosage && <span>Dosage: {med.dosage}</span>}
                                      {med.frequency && <span className="mx-2">•</span>}
                                      {med.frequency && <span>Freq: {med.frequency}</span>}
                                      {med.duration && <span className="mx-2">•</span>}
                                      {med.duration && <span>Dur: {med.duration}</span>}
                                    </div>
                                    {/* Print View */}
                                    <div className="hidden print:block text-sm text-slate-800 mt-1 font-medium">
                                      {med.dosage} {med.frequency} {med.duration ? `for ${med.duration}` : ''}
                                    </div>
                                    {med.notes && <div className="text-xs text-slate-500 mt-1">Note: {med.notes}</div>}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500">No medications recorded.</p>
                            )}
                            {rx.doctor_notes && (
                              <div className="bg-blue-50 text-[#1434A4] p-3 rounded-lg text-sm print:bg-blue-50 print:border-none">
                                <strong>Doctor Directions:</strong> {rx.doctor_notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Eye Measurements */}
                    {eyeMeasurements.length > 0 && (
                      <div className="border-t border-slate-100 pt-6 print:pt-3 print:border-slate-200">
                        <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4 print:mb-2">
                          <Eye size={18} className="text-[#1434A4]" /> Eye Measurements
                        </h4>
                        {eyeMeasurements.map(em => (
                          <div key={em.id} className="overflow-hidden rounded-xl border border-slate-200 print:border-slate-300">
                            <table className="w-full text-center text-sm">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 print:bg-slate-50">
                                  <th className="py-2 px-4 border-l border-slate-200">Eye</th>
                                  <th className="py-2 px-4 border-l border-slate-200">SPH</th>
                                  <th className="py-2 px-4 border-l border-slate-200">CYL</th>
                                  <th className="py-2 px-4">Axis</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="border-b border-slate-200">
                                  <td className="py-2 px-4 font-bold border-l border-slate-200 text-green-700">Left (OS)</td>
                                  <td className="py-2 px-4 border-l border-slate-200" dir="ltr">{em.left_sph || '-'}</td>
                                  <td className="py-2 px-4 border-l border-slate-200" dir="ltr">{em.left_cyl || '-'}</td>
                                  <td className="py-2 px-4" dir="ltr">{em.left_axis || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="py-2 px-4 font-bold border-l border-slate-200 text-blue-700">Right (OD)</td>
                                  <td className="py-2 px-4 border-l border-slate-200" dir="ltr">{em.right_sph || '-'}</td>
                                  <td className="py-2 px-4 border-l border-slate-200" dir="ltr">{em.right_cyl || '-'}</td>
                                  <td className="py-2 px-4" dir="ltr">{em.right_axis || '-'}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Attachments & Associated Notes */}
                    {(vAttachments.length > 0 || vNotes.length > 0) && (
                      <div className="border-t border-slate-100 pt-6 print:pt-3 grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-6 print:gap-4 print:border-slate-200">
                        {vAttachments.length > 0 && (
                          <div>
                            <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-3">
                              <Paperclip size={18} className="text-[#1434A4]" /> Attachments
                            </h4>
                            <div className="flex flex-col gap-4">
                              {vAttachments.map(a => {
                                const isImage = a.file_type === 'Image'
                                return (
                                  <div key={a.id} className="border border-slate-200 rounded-lg p-3 print:border-slate-300 break-inside-avoid">
                                    <div className="font-semibold text-slate-800 text-sm mb-2">
                                      {a.description || (isImage ? 'Attached Image' : 'PDF Document')}
                                    </div>
                                    <SecureAttachment 
                                      fileUrl={a.file_url} 
                                      fileType={a.file_type} 
                                      description={a.description} 
                                      className={isImage ? "w-full max-h-[500px] object-contain rounded bg-slate-50" : "text-[#1434A4] underline text-sm font-bold flex items-center gap-1"} 
                                      renderAsLink={!isImage} 
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                        {vNotes.length > 0 && (
                          <div>
                            <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-3">
                              <FileText size={18} className="text-[#1434A4]" /> Additional Notes
                            </h4>
                            <ul className="space-y-2">
                              {vNotes.map(n => (
                                <li key={n.id} className="text-sm text-slate-600 bg-amber-50 p-3 rounded-lg border border-amber-100 print:bg-amber-50 print:border-amber-100 print:text-slate-800">
                                  {n.content}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Print Styles Override for better PDF backgrounds */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}} />

      </div>
    </div>
  )
}
