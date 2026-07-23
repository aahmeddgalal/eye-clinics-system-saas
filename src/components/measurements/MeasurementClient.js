'use client'

import { useState, useEffect } from 'react'
import { Printer, Save, Loader2, X, CheckCircle2 } from 'lucide-react'
import { createEyeMeasurementAction } from '@/app/dashboard/measurements/actions'
import { formatCairoDate } from '@/utils/timezone'
import PatientAutocomplete from '@/components/ui/PatientAutocomplete'

export default function MeasurementClient({ patients }) {
  const [isPrinting, setIsPrinting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Form State
  const [patientId, setPatientId] = useState('')
  const [measurement, setMeasurement] = useState({
    right_sph: '', right_cyl: '', right_axis: '',
    left_sph: '', left_cyl: '', left_axis: ''
  })
  
  const doctorName = "Dr. Sabry"

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isPrinting) {
      const timer = setTimeout(() => {
        window.print()
      }, 500)
      
      const handleAfterPrint = () => {
        setIsPrinting(false)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        // Reset form
        setPatientId('')
        setMeasurement({
          right_sph: '', right_cyl: '', right_axis: '',
          left_sph: '', left_cyl: '', left_axis: ''
        })
      }
      window.addEventListener('afterprint', handleAfterPrint)
      
      return () => {
        clearTimeout(timer)
        window.removeEventListener('afterprint', handleAfterPrint)
      }
    }
  }, [isPrinting])

  const handleSave = async (e, shouldPrint) => {
    e.preventDefault()
    if (!patientId) {
      setError('يرجى اختيار المريض.')
      return
    }

    setIsLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('patient_id', patientId)
    formData.append('right_sph', measurement.right_sph)
    formData.append('right_cyl', measurement.right_cyl)
    formData.append('right_axis', measurement.right_axis)
    formData.append('left_sph', measurement.left_sph)
    formData.append('left_cyl', measurement.left_cyl)
    formData.append('left_axis', measurement.left_axis)

    const result = await createEyeMeasurementAction(formData)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      setIsLoading(false)
      if (shouldPrint) {
        setIsPrinting(true)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        // Reset form
        setPatientId('')
        setMeasurement({
          right_sph: '', right_cyl: '', right_axis: '',
          left_sph: '', left_cyl: '', left_axis: ''
        })
      }
    }
  }

  const activePatient = patients.find(p => p.id === patientId)

  if (isPrinting) {
    return (
      <div className="fixed inset-0 bg-white z-[100] flex justify-center w-full min-h-screen">
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { size: A5 landscape; margin: 0; }
            body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}} />

        {/* A5 Landscape Container - 210 x 148 mm */}
        <div className="w-[210mm] min-h-[148mm] print:min-h-0 print:h-auto print:block bg-white text-slate-900 p-8 flex flex-col mx-auto relative shadow-2xl print:shadow-none print:m-0 border border-slate-200 print:border-none">
          
          <div className="border-b-2 border-[#1434A4] pb-3 mb-4 flex justify-between items-end">
            <div>
              <h1 className="text-xl font-bold text-[#1434A4]">عيادة العيون - مقاس النظارة</h1>
              <p className="text-sm font-semibold mt-1">{doctorName}</p>
            </div>
            <div className="text-end">
              <p className="text-xs text-slate-500">التاريخ: {formatCairoDate(new Date())}</p>
            </div>
          </div>

          <div className="mb-6 flex gap-8 text-sm">
            <div><span className="text-slate-500">المريض: </span><span className="font-bold">{activePatient?.full_name}</span></div>
            <div><span className="text-slate-500">العمر: </span><span className="font-bold">{activePatient?.age || '-'}</span></div>
          </div>

          {/* Measurements Table */}
          <div className="flex-1">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-[#1434A4]/5">
                  <th className="border border-slate-300 p-3 w-1/4"></th>
                  <th className="border border-slate-300 p-3 font-bold text-slate-700">SPH</th>
                  <th className="border border-slate-300 p-3 font-bold text-slate-700">CYL</th>
                  <th className="border border-slate-300 p-3 font-bold text-slate-700">AXIS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-4 font-bold text-[#1434A4] bg-[#1434A4]/5">العين اليمنى (OD)</td>
                  <td className="border border-slate-300 p-4 text-lg font-mono">{measurement.right_sph || '-'}</td>
                  <td className="border border-slate-300 p-4 text-lg font-mono">{measurement.right_cyl || '-'}</td>
                  <td className="border border-slate-300 p-4 text-lg font-mono">{measurement.right_axis || '-'}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-4 font-bold text-[#1434A4] bg-[#1434A4]/5">العين اليسرى (OS)</td>
                  <td className="border border-slate-300 p-4 text-lg font-mono">{measurement.left_sph || '-'}</td>
                  <td className="border border-slate-300 p-4 text-lg font-mono">{measurement.left_cyl || '-'}</td>
                  <td className="border border-slate-300 p-4 text-lg font-mono">{measurement.left_axis || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex justify-between items-end">
            <div className="text-xs text-slate-400">غير صالحة للعدسات اللاصقة.</div>
            <div className="text-center">
              <div className="w-40 border-b border-slate-400 mb-2"></div>
              <p className="text-xs font-semibold text-slate-600">توقيع الطبيب/أخصائي البصريات</p>
            </div>
          </div>
          
        </div>
        
        <div className="fixed top-4 end-4 print:hidden">
          <button 
            onClick={() => setIsPrinting(false)}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2 hover:bg-slate-800"
          >
            <X size={16} /> إلغاء الطباعة
          </button>
        </div>
      </div>
    )
  }

  // FORM VIEW
  if (!mounted) {
    return <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 animate-pulse h-96"></div>
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-lg text-sm border border-emerald-100 mb-6 flex items-center gap-2">
          <CheckCircle2 size={18} />
          تم حفظ القياسات بنجاح!
        </div>
      )}

      <div className="space-y-8">
        
        {/* Patient Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">اختر المريض *</label>
          <PatientAutocomplete 
            patients={patients}
            value={patientId}
            onChange={setPatientId}
          />
        </div>

        {/* Measurements Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Right Eye */}
          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
            <h3 className="font-bold text-[#1434A4] mb-4 text-center border-b border-slate-200 pb-2">العين اليمنى (OD)</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">كروي (SPH)</label>
                <input
                  type="number"
                  step="0.25"
                  value={measurement.right_sph}
                  onChange={e => setMeasurement({...measurement, right_sph: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-white text-[#111827] placeholder-[#9CA3AF] text-center font-mono"
                  placeholder="+0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">أسطواني (CYL)</label>
                <input
                  type="number"
                  step="0.25"
                  value={measurement.right_cyl}
                  onChange={e => setMeasurement({...measurement, right_cyl: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-white text-[#111827] placeholder-[#9CA3AF] text-center font-mono"
                  placeholder="-0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">المحور (AXIS)</label>
                <input
                  type="number"
                  min="0"
                  max="180"
                  value={measurement.right_axis}
                  onChange={e => setMeasurement({...measurement, right_axis: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-white text-[#111827] placeholder-[#9CA3AF] text-center font-mono"
                  placeholder="0 إلى 180"
                />
              </div>
            </div>
          </div>

          {/* Left Eye */}
          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
            <h3 className="font-bold text-[#1434A4] mb-4 text-center border-b border-slate-200 pb-2">العين اليسرى (OS)</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">كروي (SPH)</label>
                <input
                  type="number"
                  step="0.25"
                  value={measurement.left_sph}
                  onChange={e => setMeasurement({...measurement, left_sph: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-white text-[#111827] placeholder-[#9CA3AF] text-center font-mono"
                  placeholder="+0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">أسطواني (CYL)</label>
                <input
                  type="number"
                  step="0.25"
                  value={measurement.left_cyl}
                  onChange={e => setMeasurement({...measurement, left_cyl: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-white text-[#111827] placeholder-[#9CA3AF] text-center font-mono"
                  placeholder="-0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">المحور (AXIS)</label>
                <input
                  type="number"
                  min="0"
                  max="180"
                  value={measurement.left_axis}
                  onChange={e => setMeasurement({...measurement, left_axis: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-white text-[#111827] placeholder-[#9CA3AF] text-center font-mono"
                  placeholder="0 إلى 180"
                />
              </div>
            </div>
          </div>

        </div>

      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-4">
        <button
          onClick={(e) => handleSave(e, false)}
          disabled={isLoading || !patientId}
          className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
          حفظ في الملف
        </button>
        <button
          onClick={(e) => handleSave(e, true)}
          disabled={isLoading || !patientId}
          className="px-8 py-3 bg-[#1434A4] text-white rounded-xl font-bold hover:bg-[#102a83] disabled:opacity-50 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />} 
          حفظ وطباعة
        </button>
      </div>

    </div>
  )
}
