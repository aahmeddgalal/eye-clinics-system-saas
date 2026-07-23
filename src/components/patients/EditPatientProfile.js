'use client'

import { useState } from 'react'
import { Edit2 } from 'lucide-react'
import PatientModal from './PatientModal'

export default function EditPatientProfile({ patient }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="p-2 text-slate-400 hover:text-[#1434A4] hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 border border-slate-200 shadow-sm"
        title="Edit Patient Info"
      >
        <Edit2 size={16} />
        <span className="text-sm font-medium">Edit Info</span>
      </button>

      <PatientModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        patient={patient}
      />
    </>
  )
}
