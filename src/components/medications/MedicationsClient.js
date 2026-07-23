'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Plus, Edit2, Trash2, Loader2, Pill } from 'lucide-react'
import MedicationModal from './MedicationModal'
import { deleteMedicationAction } from '@/app/dashboard/medications/actions'
import AutocompleteSearch from '@/components/ui/AutocompleteSearch'
import { searchMedications } from '@/app/dashboard/search/actions'
import { formatCairoDate } from '@/utils/timezone'

export default function MedicationsClient({ initialMedications, searchQuery }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMedication, setSelectedMedication] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  function handleAddMedication() {
    setSelectedMedication(null)
    setIsModalOpen(true)
  }

  function handleEditMedication(medication) {
    setSelectedMedication(medication)
    setIsModalOpen(true)
  }

  async function handleDeleteMedication(id) {
    if (!confirm('Are you sure you want to delete this medication? This action cannot be undone.')) return
    
    setDeletingId(id)
    await deleteMedicationAction(id)
    setDeletingId(null)
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <AutocompleteSearch 
          placeholder="Search medication by name..."
          initialValue={searchQuery || ''}
          onSearchAction={searchMedications}
          onSelect={(medication) => {
            const params = new URLSearchParams(searchParams.toString())
            params.set('q', medication.name)
            router.push(`/dashboard/medications?${params.toString()}`)
          }}
          renderItem={(medication, query, HighlightMatch) => (
            <div className="font-bold text-slate-900 text-sm">
              <HighlightMatch text={medication.name} query={query} />
            </div>
          )}
        />

        <button 
          onClick={handleAddMedication}
          className="w-full sm:w-auto px-4 py-2.5 bg-[#1434A4] hover:bg-[#102a83] text-white text-sm font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 hover:scale-[1.02]"
          suppressHydrationWarning
        >
          <Plus size={18} />
          Add Medication
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-start text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold w-1/3">Medication Name</th>
                <th scope="col" className="px-6 py-4 font-semibold hidden md:table-cell">Description</th>
                <th scope="col" className="px-6 py-4 font-semibold hidden xl:table-cell w-48">Date Added</th>
                <th scope="col" className="px-6 py-4 font-semibold text-end w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialMedications.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Pill size={48} className="text-slate-300 mb-4" />
                      <p className="text-base font-medium text-slate-800">No medications found</p>
                      <p className="text-sm mt-1">Add a new medication to populate the list.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                initialMedications.map((medication) => (
                  <tr key={medication.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                    
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{medication.name}</div>
                      <div className="text-xs text-slate-500 md:hidden truncate max-w-[200px] mt-1">
                        {medication.description || 'No description'}
                      </div>
                    </td>

                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="text-slate-600 line-clamp-2" title={medication.description}>
                        {medication.description || '-'}
                      </div>
                    </td>

                    <td className="px-6 py-4 hidden xl:table-cell text-slate-500">
                      {formatCairoDate(medication.created_at)}
                    </td>

                    <td className="px-6 py-4 text-end">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditMedication(medication)}
                          className="p-2 text-slate-400 hover:text-[#1434A4] hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Medication"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteMedication(medication.id)}
                          disabled={deletingId === medication.id}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete Medication"
                        >
                          {deletingId === medication.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <MedicationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        medication={selectedMedication} 
      />
    </>
  )
}
