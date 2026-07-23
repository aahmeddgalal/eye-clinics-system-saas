'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, User, Play, CheckCircle2, Trash2, Loader2, ExternalLink, FileText } from 'lucide-react'
import { addToQueueAction, updateQueueStatusAction, removeFromQueueAction } from '@/app/dashboard/queue/actions'
import { createPatientInlineAction } from '@/app/dashboard/patients/actions'
import { formatCairoTime } from '@/utils/timezone'
import PatientAutocomplete from '@/components/ui/PatientAutocomplete'

export default function QueueClient({ initialQueue, patients }) {
  const [isAdding, setIsAdding] = useState(false)
  const [loadingId, setLoadingId] = useState(null)
  const [error, setError] = useState(null)
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [localPatients, setLocalPatients] = useState(patients)

  // Sync with prop updates
  useEffect(() => {
    setLocalPatients(patients)
  }, [patients])

  const handleAddNewPatient = async (patientData) => {
    const res = await createPatientInlineAction(patientData)
    if (res.success && res.data) {
      setLocalPatients(prev => [...prev, res.data])
      setSelectedPatientId(res.data.id)
      return res.data
    } else if (res.error) {
      setError(res.error)
      return null
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    setIsAdding(true)
    setError(null)
    
    const formData = new FormData(e.target)
    const result = await addToQueueAction(formData)
    
    if (result?.error) {
      setError(result.error)
    } else {
      e.target.reset()
      setSelectedPatientId('')
    }
    setIsAdding(false)
  }

  const handleStatusChange = async (id, newStatus) => {
    setLoadingId(id)
    await updateQueueStatusAction(id, newStatus)
    setLoadingId(null)
  }

  const handleRemove = async (id) => {
    if (!confirm('هل تريد إزالة هذا المريض من القائمة؟')) return
    setLoadingId(id)
    await removeFromQueueAction(id)
    setLoadingId(null)
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'waiting':
        return <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">في الانتظار</span>
      case 'in_progress':
        return <span className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full animate-pulse">جاري الكشف</span>
      case 'completed':
        return <span className="px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full">مكتمل</span>
      default:
        return <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-800 rounded-full">{status}</span>
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left Column: Add to Queue */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 mb-4">إضافة للقائمة</h2>
          
          {error && <div className="mb-4 text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}

          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">اختر مريض مسجل</label>
              <PatientAutocomplete 
                patients={localPatients}
                value={selectedPatientId}
                onChange={setSelectedPatientId}
                onAddNew={handleAddNewPatient}
              />
              <input type="hidden" name="patient_id" value={selectedPatientId} required />
            </div>

            <button
              type="submit"
              disabled={isAdding}
              className="w-full py-2.5 bg-[#1434A4] text-white rounded-lg text-sm font-bold hover:bg-[#102a83] hover:scale-[1.02] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
              suppressHydrationWarning
            >
              {isAdding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              إضافة لقائمة الانتظار
            </button>
          </form>
        </div>

        {/* Quick Stats */}
        <div className="bg-[#1434A4] p-6 rounded-2xl shadow-sm border border-[#1434A4] text-white">
          <h3 className="text-sm font-medium text-blue-200 mb-1">الإجمالي في القائمة اليوم</h3>
          <p className="text-4xl font-bold">{initialQueue.length}</p>
          
          <div className="flex gap-4 mt-4 pt-4 border-t border-blue-800/50">
            <div>
              <p className="text-xs text-blue-200">في الانتظار</p>
              <p className="font-semibold">{initialQueue.filter(q => q.status === 'waiting').length}</p>
            </div>
            <div>
              <p className="text-xs text-blue-200">مكتمل</p>
              <p className="font-semibold">{initialQueue.filter(q => q.status === 'completed').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Queue List */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h2 className="font-bold text-slate-900">قائمة اليوم</h2>
          </div>

          <div className="divide-y divide-slate-100">
            {initialQueue.length === 0 ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                <User size={48} className="text-slate-300 mb-4" />
                <p className="font-medium text-slate-800">القائمة فارغة</p>
                <p className="text-sm mt-1">أضف مريضاً لبدء العمل بالعيادة.</p>
              </div>
            ) : (
              initialQueue.map((item, index) => (
                <div key={item.id} className={`p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${item.status === 'in_progress' ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 shrink-0">
                      #{index + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{item.patients?.full_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                          item.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {item.status === 'waiting' ? 'في الانتظار' :
                           item.status === 'in_progress' ? 'في الكشف' :
                           'مكتمل'}
                        </span>
                        <span className="text-xs text-slate-400">أضيف في {formatCairoTime(item.scheduled_date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    
                    {/* Status Actions */}
                    {item.status === 'waiting' && (
                      <button 
                        onClick={() => handleStatusChange(item.id, 'in_progress')}
                        disabled={loadingId === item.id}
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                        title="نداء المريض (بدء الكشف)"
                        suppressHydrationWarning
                      >
                        {loadingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} className="fill-current" />}
                        نداء
                      </button>
                    )}
                    
                    {item.status === 'in_progress' && (
                      <button 
                        onClick={() => handleStatusChange(item.id, 'completed')}
                        disabled={loadingId === item.id}
                        className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                        title="تحديد كمكتمل"
                        suppressHydrationWarning
                      >
                        {loadingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        إنهاء
                      </button>
                    )}

                    <div className="w-px h-6 bg-slate-200 mx-1"></div>

                    {/* Meta Actions */}
                    <Link 
                      href={`/dashboard/patients/${item.patient_id}/report`}
                      className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      title="تقرير المريض"
                    >
                      <FileText size={18} />
                    </Link>
                    <Link 
                      href={`/dashboard/patients/${item.patient_id}`}
                      className="p-2 text-slate-400 hover:text-[#1434A4] hover:bg-blue-50 rounded-lg transition-colors"
                      title="فتح ملف المريض"
                    >
                      <ExternalLink size={18} />
                    </Link>
                    
                    <button 
                      onClick={() => handleRemove(item.id)}
                      disabled={loadingId === item.id}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="إزالة من القائمة"
                      suppressHydrationWarning
                    >
                      {loadingId === item.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                    </button>

                  </div>
                </div>
              ))
            )}
          </div>
          
        </div>
      </div>

    </div>
  )
}
