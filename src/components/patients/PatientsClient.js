'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Plus, Edit2, Trash2, Loader2, UserCircle, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import PatientModal from './PatientModal'
import { deletePatientAction } from '@/app/dashboard/patients/actions'
import AutocompleteSearch from '@/components/ui/AutocompleteSearch'
import { searchPatients } from '@/app/dashboard/search/actions'
import { formatCairoDate } from '@/utils/timezone'

export default function PatientsClient({ initialPatients = [], searchQuery = '', stats = null }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [searchInput, setSearchInput] = useState(searchQuery)

  // Handle Search using URL params
  function handleSearch(e) {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchInput.trim()) {
      params.set('q', searchInput.trim())
    } else {
      params.delete('q')
    }
    router.push(`/dashboard/patients?${params.toString()}`)
  }
  function handleAddPatient() {
    setSelectedPatient(null)
    setIsModalOpen(true)
  }

  // Handle Edit Patient Click
  function handleEditPatient(patient) {
    setSelectedPatient(patient)
    setIsModalOpen(true)
  }

  // Handle Delete Patient Click
  async function handleDeletePatient(id) {
    if (!confirm('Are you sure you want to delete this patient? This action cannot be undone.')) return
    
    setDeletingId(id)
    await deletePatientAction(id)
    setDeletingId(null)
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <AutocompleteSearch 
          placeholder="Search by name or phone..."
          initialValue={searchQuery || ''}
          onSearchAction={searchPatients}
          onSelect={(patient) => {
            router.push(`/dashboard/patients/${patient.id}`)
          }}
          renderItem={(patient, query, HighlightMatch) => (
            <div>
              <div className="font-bold text-slate-900 text-sm">
                <HighlightMatch text={patient.full_name} query={query} />
              </div>
              <div className="text-xs text-slate-500 mt-1" dir="ltr">
                <HighlightMatch text={patient.phone || ''} query={query} />
              </div>
            </div>
          )}
        />

        <button onClick={handleAddPatient} className="w-full sm:w-auto px-4 py-2.5 bg-[#1434A4] text-white rounded-xl font-bold hover:bg-[#102a83] transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
          <Plus size={20} /> Add New Patient
        </button>
      </div>

      {/* Stats Section */}
      {stats && !searchQuery && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-4 bg-blue-50 text-[#1434A4] rounded-xl">
              <UserCircle size={32} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Patients</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.total.toLocaleString('en-US')}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 flex items-center gap-4">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
              <Plus size={32} />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-600">New This Month</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.newThisMonth.toLocaleString('en-US')}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {!searchQuery && (
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText size={20} className="text-[#1434A4]" />
              Recent Patients (Latest Modified / Added)
            </h2>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-start text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold">Patient Name</th>
                <th scope="col" className="px-6 py-4 font-semibold hidden md:table-cell">Contact Info</th>
                <th scope="col" className="px-6 py-4 font-semibold hidden lg:table-cell">Personal Details</th>
                <th scope="col" className="px-6 py-4 font-semibold hidden xl:table-cell">Date Added</th>
                <th scope="col" className="px-6 py-4 font-semibold text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialPatients.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <UserCircle size={48} className="text-slate-300 mb-4" />
                      <p className="text-base font-medium text-slate-800">No Patients Found</p>
                      <p className="text-sm mt-1">Try a different search or add a new patient.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                initialPatients.map((patient) => (
                  <tr 
                    key={patient.id} 
                    onClick={() => router.push(`/dashboard/patients/${patient.id}`)}
                    className="border-b border-slate-50 hover:bg-blue-50/50 cursor-pointer transition-all group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#1434A4] font-bold group-hover:bg-[#1434A4] group-hover:text-white transition-colors">
                          {patient.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 group-hover:text-[#1434A4] transition-colors">{patient.full_name}</div>
                          <div className="text-xs text-slate-500 md:hidden">{patient.phone || 'No phone'}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="text-slate-900">{patient.phone || '-'}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[150px]" title={patient.address}>{patient.address || '-'}</div>
                    </td>

                    <td className="px-6 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        {patient.gender && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 group-hover:bg-white transition-colors">
                            {patient.gender}
                          </span>
                        )}
                        {patient.age && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 group-hover:bg-white transition-colors">
                            {patient.age} years
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 hidden xl:table-cell text-slate-500">
                      {formatCairoDate(patient.created_at)}
                    </td>

                    <td className="px-6 py-4 text-end">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/dashboard/patients/${patient.id}/report`)
                          }}
                          className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors"
                          title="Patient Report"
                          suppressHydrationWarning
                        >
                          <FileText size={16} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditPatient(patient)
                          }}
                          className="p-2 text-slate-400 hover:text-[#1434A4] hover:bg-white rounded-lg transition-colors"
                          title="Edit"
                          suppressHydrationWarning
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeletePatient(patient.id)
                          }}
                          disabled={deletingId === patient.id}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                          suppressHydrationWarning
                        >
                          {deletingId === patient.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
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

      <PatientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        patient={selectedPatient} 
      />
    </>
  )
}
