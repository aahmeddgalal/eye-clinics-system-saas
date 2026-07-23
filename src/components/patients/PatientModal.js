'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, AlertTriangle, Calendar, Phone, ExternalLink } from 'lucide-react'
import { createPatientAction, updatePatientAction } from '@/app/dashboard/patients/actions'
import { formatCairoDate } from '@/utils/timezone'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

export default function PatientModal({ isOpen, onClose, patient }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [duplicatePatient, setDuplicatePatient] = useState(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError(null)
      setDuplicatePatient(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const isEditing = !!patient

  async function handleSubmit(e) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.target)

    try {
      let result
      if (isEditing) {
        result = await updatePatientAction(patient.id, formData)
      } else {
        result = await createPatientAction(formData)
      }

      if (result?.duplicate) {
        setDuplicatePatient(result.duplicate)
        setIsLoading(false)
        return
      }

      if (result?.error) {
        setError(result.error)
        setIsLoading(false)
      } else {
        setIsLoading(false)
        onClose()
      }
    } catch (err) {
      console.error(err)
      toast.error('No internet connection or server unreachable')
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-semibold text-slate-800">
            {isEditing ? 'Edit Patient' : 'Add New Patient'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto p-6">
          {duplicatePatient ? (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">This patient is already registered!</h3>
              <p className="text-slate-500 mb-6 max-w-sm">
                A patient matching the same name or phone number was found to prevent duplicates.
              </p>
              
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 w-full max-w-sm text-start mb-6">
                <h4 className="font-bold text-slate-900 text-lg mb-3">{duplicatePatient.full_name}</h4>
                <div className="space-y-2 text-sm text-slate-600">
                  {duplicatePatient.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-slate-400" />
                      <span dir="ltr">{duplicatePatient.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    <span>Last Visit: {duplicatePatient.last_visit_date ? formatCairoDate(duplicatePatient.last_visit_date) : 'No previous visits'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full max-w-sm">
                <button
                  type="button"
                  onClick={() => setDuplicatePatient(null)}
                  className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  Edit Info
                </button>
                <Link
                  href={`/dashboard/patients/${duplicatePatient.id}`}
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600 transition-colors shadow-sm"
                >
                  Open File <ExternalLink size={16} />
                </Link>
              </div>
            </div>
          ) : (
            <form id="patient-form" onSubmit={handleSubmit} className="space-y-6">
              {isEditing && patient?.updated_at && (
                <input type="hidden" name="last_updated_at" value={patient.updated_at} />
              )}
              {error && (
                <div className="p-4 bg-rose-50 text-rose-600 rounded-xl flex items-center gap-3 text-sm border border-rose-100">
                  <AlertTriangle size={18} className="shrink-0" />
                  {error}
                </div>
              )}<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                <input
                  name="full_name"
                  type="text"
                  required
                  defaultValue={patient?.full_name || ''}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none transition-all bg-white text-[#111827] placeholder-[#9CA3AF]"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Age</label>
                <input
                  name="age"
                  type="number"
                  min="0"
                  max="120"
                  defaultValue={patient?.age || ''}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none transition-all bg-white text-[#111827] placeholder-[#9CA3AF]"
                  placeholder="e.g. 45"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
                <select
                  name="gender"
                  defaultValue={patient?.gender || ''}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none transition-all bg-white text-[#111827] placeholder-[#9CA3AF]"
                >
                  <option value="">Select Gender...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                <input
                  name="phone"
                  type="tel"
                  defaultValue={patient?.phone || ''}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none transition-all bg-white text-[#111827] placeholder-[#9CA3AF]"
                  placeholder="e.g. +1 234 567 8900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Marital Status</label>
                <select
                  name="marital_status"
                  defaultValue={patient?.marital_status || ''}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none transition-all bg-white text-[#111827] placeholder-[#9CA3AF]"
                >
                  <option value="">Select Status...</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                <input
                  name="address"
                  type="text"
                  defaultValue={patient?.address || ''}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none transition-all bg-white text-[#111827] placeholder-[#9CA3AF]"
                  placeholder="e.g. 123 Main St, City"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                <textarea
                  name="notes"
                  rows={4}
                  defaultValue={patient?.notes || ''}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none transition-all resize-none bg-white text-[#111827] placeholder-[#9CA3AF]"
                  placeholder="Medical history or additional notes..."
                />
              </div>

            </div>
          </form>
          )}
        </div>

        {/* Footer */}
        {!duplicatePatient && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="patient-form"
              disabled={isLoading}
              className="px-6 py-2.5 bg-[#1434A4] text-white rounded-xl font-bold hover:bg-[#102a83] transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              {isEditing ? 'Save Changes' : 'Add Patient'}
            </button>
          </div>
        )}
        
        
      </div>
    </div>
  )
}
