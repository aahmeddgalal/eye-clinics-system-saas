'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createMedicationAction, updateMedicationAction } from '@/app/dashboard/medications/actions'

export default function MedicationModal({ isOpen, onClose, medication }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen) {
      setError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const isEditing = !!medication

  async function handleSubmit(e) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.target)

    let result
    if (isEditing) {
      result = await updateMedicationAction(medication.id, formData)
    } else {
      result = await createMedicationAction(formData)
    }

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      setIsLoading(false)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-semibold text-slate-800">
            {isEditing ? 'Edit Medication' : 'Add New Medication'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <form id="medication-form" onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Medication Name *</label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={medication?.name || ''}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none transition-all bg-white text-[#111827] placeholder-[#9CA3AF]"
                  placeholder="e.g. Timolol 0.5% Drops"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description / Instructions</label>
                <textarea
                  name="description"
                  rows={5}
                  defaultValue={medication?.description || ''}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none transition-all resize-none bg-white text-[#111827] placeholder-[#9CA3AF]"
                  placeholder="Add common instructions or medication description..."
                />
              </div>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="medication-form"
            disabled={isLoading}
            className="px-5 py-2.5 text-sm font-medium text-white bg-[#1434A4] rounded-lg hover:bg-[#102a83] transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
            {isEditing ? 'Save Changes' : 'Add Medication'}
          </button>
        </div>
        
      </div>
    </div>
  )
}
