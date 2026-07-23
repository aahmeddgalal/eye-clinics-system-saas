'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { deletePatientAction } from '@/app/dashboard/patients/actions'
import toast from 'react-hot-toast'

export default function DeletePatientButton({ patientId }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this patient and all their data?')) return

    setIsDeleting(true)
    const result = await deletePatientAction(patientId)

    if (result.error) {
      toast.error('An error occurred while deleting the patient data')
      setIsDeleting(false)
    } else {
      toast.success('Patient deleted and moved to trash successfully')
      router.push('/dashboard/patients')
      router.refresh()
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
      title="Delete Patient"
    >
      {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
      Delete Patient
    </button>
  )
}
