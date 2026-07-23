'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Calendar, Clock, Edit2, Trash2, Pill, AlertCircle, FileText, Eye, MapPin, Stethoscope
} from 'lucide-react'
import { formatCairoTime } from '@/utils/timezone'
import { getVisitDetailsAction, deleteVisitAction } from '@/app/dashboard/visits/actions'
import { useRouter } from 'next/navigation'

export default function VisitDetailsModal({ isOpen, onClose, visit: initialVisit }) {
  const router = useRouter()
  const [fullVisit, setFullVisit] = useState(null)
  const [eyeMeasurement, setEyeMeasurement] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (isOpen && initialVisit?.id) {
      setFullVisit(initialVisit) // Start with what we have
      setLoading(true)
      getVisitDetailsAction(initialVisit.id, initialVisit.patient_id).then(res => {
        if (res.visitData) {
          // Merge patient data which might only be in the initialVisit
          setFullVisit({ ...res.visitData, patients: initialVisit.patients })
        }
        if (res.eyeMeasurement) {
          setEyeMeasurement(res.eyeMeasurement)
        }
        setLoading(false)
      })
    } else {
      setFullVisit(null)
      setEyeMeasurement(null)
    }
  }, [isOpen, initialVisit])

  if (!fullVisit) return null

  // Use fullVisit instead of visit from here on
  const visit = fullVisit

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to move this visit to the trash?')) return
    setIsDeleting(true)
    const res = await deleteVisitAction(visit.id)
    setIsDeleting(false)
    if (res.success) {
      onClose()
    } else {
      alert('An error occurred during deletion: ' + res.error)
    }
  }

  // Extract medications from the visit's prescriptions
  const allMedications = visit.prescriptions?.flatMap(rx => rx.medications_data || []) || []

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-white rounded-2xl shadow-2xl z-[101] overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 text-[#1434A4] rounded-xl flex items-center justify-center font-bold text-xl">
                  {visit.patients?.full_name?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{visit.patients?.full_name}</h2>
                  <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                    <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(visit.visit_date).toLocaleDateString('ar-EG')}</span>
                    <span className="flex items-center gap-1" dir="ltr"><Clock size={14} /> {formatCairoTime(visit.visit_date)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">

              {/* Diagnosis & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">
                    <AlertCircle size={16} className="text-blue-600" /> Visit Title
                  </h3>
                  <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl text-slate-700 min-h-[100px]">
                    {visit.diagnosis || 'No diagnosis recorded'}
                  </div>
                </div>
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">
                    <FileText size={16} className="text-blue-600" /> Doctor Notes
                  </h3>
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-700 min-h-[100px] whitespace-pre-wrap">
                    {visit.notes || 'No notes'}
                  </div>
                </div>
              </div>

              {/* Diagnoses (Diseases) */}
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">
                  <Stethoscope size={16} className="text-blue-600" /> Diagnoses
                </h3>
                {visit.visit_diseases && visit.visit_diseases.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {visit.visit_diseases.map((visitDisease, idx) => {
                      const disease = visitDisease.diseases
                      return (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg shrink-0">
                            <Stethoscope size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{disease?.name || 'Disease'}</p>
                            {disease?.description && (
                              <p className="text-xs text-slate-500 mt-1">{disease.description}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                    No diagnoses were added in this visit
                  </div>
                )}
              </div>

              {/* Medications */}
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">
                  <Pill size={16} className="text-blue-600" /> Prescribed Medications
                </h3>
                {allMedications.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {allMedications.map((med, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                          <Pill size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{med.name}</p>
                          <p className="text-xs text-slate-500 mt-1">{med.dosage} - {med.frequency || med.instructions} - {med.duration}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                    No medications were prescribed in this visit
                  </div>
                )}
              </div>

            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Trash2 size={16} />
                {isDeleting ? 'Deleting...' : 'Delete Visit'}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg text-sm font-bold transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    onClose()
                    router.push(`/dashboard/patients/${visit.patient_id}/edit-visit/${visit.id}`)
                  }}
                  className="px-4 py-2 text-white bg-[#1434A4] hover:bg-blue-800 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Edit2 size={16} />
                  Edit Visit
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
