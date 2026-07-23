'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw, X, Users, CalendarCheck, Pill, Paperclip, AlertTriangle, Trash2, Search, Activity, Stethoscope, Eye } from 'lucide-react'
import { restoreRecordAction, permanentDeleteAction, cleanupTrashAction, emptyTrashAction } from '@/app/dashboard/trash/actions'

const TABS = [
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'visits', label: 'Visits', icon: CalendarCheck },
  { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
  { id: 'eye_measurements', label: 'Measurements', icon: Eye },
  { id: 'attachments', label: 'Attachments', icon: Paperclip },
  { id: 'diseases', label: 'Diseases', icon: Activity },
  { id: 'medications', label: 'Medications', icon: Stethoscope },
]

export default function TrashClient({ initialItems }) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [loadingId, setLoadingId] = useState(null)
  const [activeTab, setActiveTab] = useState('patients')
  const [searchQuery, setSearchQuery] = useState('')
  const [restoreConflict, setRestoreConflict] = useState(null)
  const [isEmptying, setIsEmptying] = useState(false)

  // Run cleanup once on load
  useEffect(() => {
    cleanupTrashAction()
  }, [])

  // Sync state when server revalidates data
  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  const handleRestore = async (table, id) => {
    setLoadingId(id)
    const res = await restoreRecordAction(table, id)
    if (res.success) {
      setItems(prev => ({
        ...prev,
        [table]: prev[table].filter(item => item.id !== id)
      }))
      router.refresh()
    } else if (res.requiresPatientRestore) {
      setRestoreConflict({ type: 'patient', patientId: res.patientId, patientName: res.patientName, pendingTable: table, pendingId: id })
    } else if (res.requiresVisitRestore) {
      setRestoreConflict({ type: 'visit', visitId: res.visitId, visitDate: res.visitDate, visitDiagnosis: res.visitDiagnosis, pendingTable: table, pendingId: id })
    } else {
      alert('Error during restore: ' + res.error)
    }
    setLoadingId(null)
  }

  const handlePermanentDelete = async (table, id) => {
    if (!confirm('Are you sure you want to permanently delete this? This action cannot be undone.')) return
    setLoadingId(id)
    const res = await permanentDeleteAction(table, id)
    if (res.success) {
      setItems(prev => ({
        ...prev,
        [table]: prev[table].filter(item => item.id !== id)
      }))
      router.refresh()
    } else {
      alert('Error during deletion: ' + res.error)
    }
    setLoadingId(null)
  }

  const handleEmptyTrash = async () => {
    if (!confirm('Are you sure you want to empty the trash? All items will be permanently deleted and this action cannot be undone.')) return
    setIsEmptying(true)
    const res = await emptyTrashAction()
    if (res.success) {
      setItems({
        patients: [], visits: [], prescriptions: [], eye_measurements: [], attachments: [], diseases: [], medications: []
      })
      router.refresh()
    } else {
      alert('Error during emptying trash: ' + res.error)
    }
    setIsEmptying(false)
  }

  const getDaysInfo = (deletedAt) => {
    if (!deletedAt) return { passed: 0, remaining: 7 }
    const deletedDate = new Date(deletedAt)
    const today = new Date()
    const diffTime = Math.abs(today - deletedDate)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const remaining = 7 - diffDays
    return { 
      passed: diffDays, 
      remaining: remaining > 0 ? remaining : 0 
    }
  }

  // Filter items based on active tab and search query
  const filteredItems = useMemo(() => {
    const currentItems = items[activeTab] || []
    if (!searchQuery.trim()) return currentItems

    const lowerQuery = searchQuery.toLowerCase()
    return currentItems.filter(item => {
      const searchString = `
        ${item.full_name || ''} 
        ${item.name || ''} 
        ${item.diagnosis || ''} 
        ${item.doctor_notes || ''} 
        ${item.file_type || ''}
        ${item.patients?.full_name || ''}
      `.toLowerCase()
      return searchString.includes(lowerQuery)
    })
  }, [items, activeTab, searchQuery])

  const renderItemMetadata = (item, table) => {
    switch (table) {
      case 'patients':
        return <span className="text-sm text-slate-500">Patient</span>
      case 'visits':
        return (
          <div className="flex flex-col gap-1">
            <span className="text-sm text-slate-700">Visit Diagnosis: {item.diagnosis || 'Unspecified'}</span>
            <span className="text-xs text-slate-500">Patient: {item.patients?.full_name || 'Unknown'}</span>
          </div>
        )
      case 'prescriptions':
        return (
          <div className="flex flex-col gap-1">
            <span className="text-sm text-slate-700">Patient: {item.patients?.full_name || 'Unknown'}</span>
            <span className="text-xs text-slate-500">
              Visit Date: {item.visits?.visit_date ? new Date(item.visits.visit_date).toLocaleDateString('en-GB') : 'Unspecified'}
            </span>
          </div>
        )
      case 'eye_measurements':
        return (
          <div className="flex flex-col gap-1">
            <span className="text-sm text-slate-700">Patient: {item.patients?.full_name || 'Unknown'}</span>
            <span className="text-xs text-slate-500" dir="ltr">
              OD: {item.right_sph || '-'} | OS: {item.left_sph || '-'}
            </span>
          </div>
        )
      case 'attachments':
        return (
          <div className="flex flex-col gap-1">
            <span className="text-sm text-slate-700">Type: {item.file_type || 'Attachment'}</span>
            <span className="text-xs text-slate-500">Patient: {item.patients?.full_name || 'Unknown'}</span>
          </div>
        )
      case 'diseases':
        return (
          <span className="text-sm text-slate-500">
            Linked to {item.visit_diseases?.length || 0} visits
          </span>
        )
      case 'medications':
        return (
          <div className="flex gap-4 items-center">
            <span className="text-sm font-semibold text-slate-800">{item.name}</span>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">In Catalog</span>
          </div>
        )
      default:
        return null
    }
  }

  const isEmpty = Object.values(items).every(arr => arr.length === 0)

  if (isEmpty) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
        <Trash2 size={48} className="mx-auto text-slate-200 mb-4" />
        <h3 className="text-xl font-bold text-slate-800 mb-2">Trash is empty</h3>
        <p className="text-slate-500">There are currently no deleted items.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Header Actions */}
      <div className="flex justify-end">
        <button
          onClick={handleEmptyTrash}
          disabled={isEmptying}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors font-bold shadow-sm disabled:opacity-50"
          suppressHydrationWarning
        >
          {isEmptying ? <RotateCcw size={18} className="animate-spin" /> : <Trash2 size={18} />}
          Empty Trash
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-2">
        {TABS.map(tab => {
          const count = items[tab.id]?.length || 0
          const isActive = activeTab === tab.id
          const Icon = tab.icon

          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all flex-1 justify-center min-w-[120px] ${
                isActive 
                  ? 'bg-rose-50 text-rose-700 border border-rose-100 shadow-sm' 
                  : 'bg-transparent text-slate-500 hover:bg-slate-50 border border-transparent'
              }`}
              suppressHydrationWarning
            >
              <Icon size={18} />
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search this list..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 focus:border-[#1434A4] focus:ring-1 focus:ring-[#1434A4] outline-none text-slate-700 bg-white shadow-sm"
          suppressHydrationWarning
        />
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center h-full">
            <Search size={40} className="text-slate-200 mb-4" />
            <p className="text-slate-500 font-medium">No results found in "{TABS.find(t => t.id === activeTab)?.label}"</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredItems.map(item => {
              const { passed, remaining } = getDaysInfo(item.deleted_at)
              const title = item.full_name || item.name || `Prescription ${item.patients?.full_name || ''}` || 'Record'
              
              return (
                <div key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors group">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-lg mb-1">{title}</h3>
                    <div className="mb-3">
                      {renderItemMetadata(item, activeTab)}
                    </div>
                    <div className="flex items-center gap-2 bg-slate-100/50 w-fit px-3 py-1.5 rounded-lg border border-slate-200">
                      <AlertTriangle size={14} className={remaining <= 1 ? "text-rose-500" : "text-amber-500"} />
                      <span className={`text-sm ${remaining <= 1 ? "text-rose-600 font-bold" : "text-slate-600"}`}>
                        Deleted <span className="font-bold">{passed} {passed === 1 ? 'day' : 'days'}</span> ago - <span className="font-bold">{remaining} {remaining === 1 ? 'day' : 'days'}</span> remaining until permanent deletion
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleRestore(activeTab, item.id)}
                      disabled={loadingId === item.id}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                      suppressHydrationWarning
                    >
                      <RotateCcw size={16} /> Restore
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(activeTab, item.id)}
                      disabled={loadingId === item.id}
                      className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                      suppressHydrationWarning
                    >
                      <X size={16} /> Delete Permanently
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      {/* Restore Conflict Modal */}
      {restoreConflict && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setRestoreConflict(null)} />
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-10 animate-in fade-in zoom-in-95 p-6 text-center">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            
            {restoreConflict.type === 'patient' ? (
              <>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Patient must be restored first</h3>
                <p className="text-slate-500 mb-6">
                  This record is linked to the patient <span className="font-bold text-slate-700">{restoreConflict.patientName}</span> who is currently deleted.
                  You must restore the patient first to be able to restore this record or any of their other data.
                </p>
                <div className="flex items-center gap-3 w-full">
                  <button
                    onClick={() => setRestoreConflict(null)}
                    className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleRestore('patients', restoreConflict.patientId);
                      setRestoreConflict(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1434A4] text-white rounded-xl font-bold hover:bg-[#102a83] transition-colors"
                  >
                    <RotateCcw size={18} /> Restore Patient
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Visit must be restored first</h3>
                <p className="text-slate-500 mb-6">
                  This record is linked to a deleted visit on <span className="font-bold text-slate-700">{new Date(restoreConflict.visitDate).toLocaleDateString('en-GB')}</span> (Diagnosis: {restoreConflict.visitDiagnosis}).
                  You must restore the visit first to be able to restore this record and its dependents.
                </p>
                <div className="flex items-center gap-3 w-full">
                  <button
                    onClick={() => setRestoreConflict(null)}
                    className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleRestore('visits', restoreConflict.visitId);
                      setRestoreConflict(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1434A4] text-white rounded-xl font-bold hover:bg-[#102a83] transition-colors"
                  >
                    <RotateCcw size={18} /> Restore Visit
                  </button>
                </div>
              </>
            )}
            
          </div>
        </div>
      )}

    </div>
  )
}
