'use client'

import { useState } from 'react'
import { Eye, Edit2, Plus, X, Save } from 'lucide-react'
import { createEyeMeasurementAction, updateEyeMeasurementAction } from '@/app/dashboard/measurements/actions'

export default function EyeMeasurementsSection({ patientId, eyeMeasurements }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const latestMeasurement = eyeMeasurements?.length > 0 ? eyeMeasurements[0] : null
  const isEditing = !!latestMeasurement

  const handleOpenModal = () => setIsModalOpen(true)
  const handleCloseModal = () => setIsModalOpen(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.target)
    formData.append('patient_id', patientId)

    let res
    if (isEditing) {
      res = await updateEyeMeasurementAction(latestMeasurement.id, formData)
    } else {
      res = await createEyeMeasurementAction(formData)
    }

    setIsLoading(false)

    if (res.error) {
      alert(res.error)
    } else {
      setIsModalOpen(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-[#1434A4] rounded-lg">
            <Eye size={20} />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">قياسات النظر</h3>
        </div>
        {!latestMeasurement && (
          <button 
            onClick={handleOpenModal}
            className="p-2 text-slate-400 hover:text-[#1434A4] hover:bg-blue-50 rounded-lg transition-colors"
            title="إضافة قياس جديد"
          >
            <Plus size={20} />
          </button>
        )}
      </div>

      {latestMeasurement ? (
        <div className="space-y-4 mt-2">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative group">
            <button 
              onClick={handleOpenModal}
              className="absolute top-2 left-2 p-1.5 text-slate-400 hover:text-[#1434A4] bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-slate-100 shadow-sm"
              title="تعديل القياسات"
            >
              <Edit2 size={16} />
            </button>
            <p className="text-xs text-slate-500 mb-3 text-center">أحدث قياس: {new Date(latestMeasurement.created_at).toLocaleDateString('ar-EG')}</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                <div className="text-xs font-bold text-slate-400 text-center mb-2 border-b pb-1" dir="ltr">OD (Right)</div>
                <div className="text-sm flex justify-between"><span className="text-slate-400 text-xs">SPH</span><span className="font-bold" dir="ltr">{latestMeasurement.right_sph ?? '-'}</span></div>
                <div className="text-sm flex justify-between mt-1"><span className="text-slate-400 text-xs">CYL</span><span className="font-bold" dir="ltr">{latestMeasurement.right_cyl ?? '-'}</span></div>
                <div className="text-sm flex justify-between mt-1"><span className="text-slate-400 text-xs">AXS</span><span className="font-bold" dir="ltr">{latestMeasurement.right_axis ?? '-'}</span></div>
              </div>
              
              <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                <div className="text-xs font-bold text-slate-400 text-center mb-2 border-b pb-1" dir="ltr">OS (Left)</div>
                <div className="text-sm flex justify-between"><span className="text-slate-400 text-xs">SPH</span><span className="font-bold" dir="ltr">{latestMeasurement.left_sph ?? '-'}</span></div>
                <div className="text-sm flex justify-between mt-1"><span className="text-slate-400 text-xs">CYL</span><span className="font-bold" dir="ltr">{latestMeasurement.left_cyl ?? '-'}</span></div>
                <div className="text-sm flex justify-between mt-1"><span className="text-slate-400 text-xs">AXS</span><span className="font-bold" dir="ltr">{latestMeasurement.left_axis ?? '-'}</span></div>
              </div>
            </div>
          </div>
          <button 
            onClick={handleOpenModal}
            className="w-full py-2 text-sm font-medium text-[#1434A4] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100 flex items-center justify-center gap-2"
          >
            <Edit2 size={16} /> تعديل القياسات
          </button>
        </div>
      ) : (
        <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-100 border-dashed mt-2 flex flex-col items-center">
          <p className="text-sm text-slate-500 mb-3">لا يوجد قياسات مسجلة.</p>
          <button 
            onClick={handleOpenModal}
            className="px-4 py-2 text-sm font-medium text-white bg-[#1434A4] hover:bg-[#102a83] rounded-lg transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus size={16} /> إضافة قياس جديد
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">
                {isEditing ? 'تعديل قياسات النظر' : 'إضافة قياسات نظر جديدة'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                
                {/* Right Eye */}
                <div className="space-y-4">
                  <div className="font-bold text-[#1434A4] border-b border-blue-100 pb-2 text-center" dir="ltr">OD (Right Eye)</div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1" dir="ltr">SPH</label>
                    <input 
                      type="number" 
                      step="0.25" 
                      name="right_sph"
                      defaultValue={latestMeasurement?.right_sph ?? ''}
                      placeholder="-1.25"
                      dir="ltr"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1" dir="ltr">CYL</label>
                    <input 
                      type="number" 
                      step="0.25" 
                      name="right_cyl"
                      defaultValue={latestMeasurement?.right_cyl ?? ''}
                      placeholder="-0.50"
                      dir="ltr"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1" dir="ltr">AXIS</label>
                    <input 
                      type="number" 
                      name="right_axis"
                      defaultValue={latestMeasurement?.right_axis ?? ''}
                      placeholder="180"
                      dir="ltr"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-center"
                    />
                  </div>
                </div>

                {/* Left Eye */}
                <div className="space-y-4">
                  <div className="font-bold text-[#1434A4] border-b border-blue-100 pb-2 text-center" dir="ltr">OS (Left Eye)</div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1" dir="ltr">SPH</label>
                    <input 
                      type="number" 
                      step="0.25" 
                      name="left_sph"
                      defaultValue={latestMeasurement?.left_sph ?? ''}
                      placeholder="-1.25"
                      dir="ltr"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1" dir="ltr">CYL</label>
                    <input 
                      type="number" 
                      step="0.25" 
                      name="left_cyl"
                      defaultValue={latestMeasurement?.left_cyl ?? ''}
                      placeholder="-0.50"
                      dir="ltr"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1" dir="ltr">AXIS</label>
                    <input 
                      type="number" 
                      name="left_axis"
                      defaultValue={latestMeasurement?.left_axis ?? ''}
                      placeholder="180"
                      dir="ltr"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-center"
                    />
                  </div>
                </div>

              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 flex justify-center items-center gap-2 px-4 py-2 text-white bg-[#1434A4] hover:bg-[#102a83] rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <Save size={18} />
                  {isLoading ? 'جاري الحفظ...' : 'حفظ القياسات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
