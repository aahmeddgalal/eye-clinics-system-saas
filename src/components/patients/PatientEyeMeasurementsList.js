'use client'

import { Eye, Edit2, Printer, Plus, X, Save, Trash2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { formatCairoDate } from '@/utils/timezone'
import { createEyeMeasurementAction, updateEyeMeasurementAction, deleteEyeMeasurementAction } from '@/app/dashboard/patients/actions'

export default function PatientEyeMeasurementsList({ patient, eyeMeasurements = [] }) {
  const [selectedMeasurement, setSelectedMeasurement] = useState(null)
  const [isPrinting, setIsPrinting] = useState(false)
  
  const formatValue = (val) => {
    if (val === null || val === undefined || val === '') return '';
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    
    let strVal = String(val).trim();
    // Add '.0' if it's an integer and doesn't already have a decimal
    if (Number.isInteger(num) && !strVal.includes('.')) {
      strVal = `${strVal}.0`;
    }

    if (num > 0 && !strVal.startsWith('+')) {
      return `+${strVal}`;
    }
    return strVal;
  }

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(null)

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this measurement?')) return
    setIsDeleting(id)
    const res = await deleteEyeMeasurementAction(id, patient.id)
    if (res?.error) {
      alert(res.error)
    }
    setIsDeleting(null)
  }

  const handleOpenNew = () => {
    setIsEditing(false)
    setEditData(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (m) => {
    setIsEditing(true)
    setEditData(m)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.target)
    formData.append('patient_id', patient.id)
    // If editing, we just update the specific record to fix typos.
    // If new, it creates a new record in the timeline (never overwriting old).

    let res
    if (isEditing && editData) {
      res = await updateEyeMeasurementAction(editData.id, formData)
    } else {
      res = await createEyeMeasurementAction(formData)
    }

    setIsLoading(false)

    if (res?.error) {
      alert(res.error)
    } else {
      setIsModalOpen(false)
    }
  }

  const handlePrint = (measurement) => {
    setSelectedMeasurement(measurement)
    setIsPrinting(true)
    setTimeout(() => {
      window.print()
    }, 500)
    
    const handleAfterPrint = () => {
      setIsPrinting(false)
      setSelectedMeasurement(null)
      window.removeEventListener('afterprint', handleAfterPrint)
    }
    window.addEventListener('afterprint', handleAfterPrint)
  }

  // Print View
  if (isPrinting && selectedMeasurement && typeof document !== 'undefined') {
    const printOverlay = (
      <div id="print-mount" className="fixed inset-0 bg-white z-[100] flex justify-center w-full overflow-y-auto min-h-screen print:static print:block print:overflow-visible">
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { size: A5; margin: 0; }
            body > *:not(#print-mount) {
              display: none !important;
            }
            body { 
              background: white !important; 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
              margin: 0; 
              padding: 0;
            }
            #print-mount {
              position: static !important;
              display: block !important;
              min-height: auto !important;
            }
          }
        `}} />

        <div 
          className="w-[148mm] min-h-[210mm] print:min-h-0 print:block bg-white text-slate-900 pt-[4.7cm] pb-[4.0cm] pr-[0.5cm] pl-[1.0cm] flex flex-col mx-auto relative shadow-2xl print:shadow-none print:m-0 border border-slate-200 print:border-none"
          dir="rtl"
        >
          {/* Patient Details */}
          <div className="flex justify-between items-end mb-8 text-[16px] font-bold text-black" style={{ fontFamily: "'Traditional Arabic', Arial, sans-serif" }}>
            {/* Right Side: Patient Data */}
            <div className="text-right whitespace-nowrap" dir="rtl" style={{ lineHeight: '1.8' }}>
              <div><span className="text-[20px]">الاسم :</span> <span className="mr-1 text-[20px]">{patient?.full_name}</span></div>
              <div><span>التاريـــخ :</span> <span className="mr-1">{formatCairoDate(selectedMeasurement.created_at)}</span></div>
            </div>

            {/* Left Side: Empty for Eye Measurements */}
            <div></div>
          </div>

          <div className="flex-1 mt-6 flex justify-center" dir="ltr" style={{ fontFamily: "'Times New Roman', serif" }}>
            <table 
              className="w-full text-center font-bold text-black border-2 border-black overflow-hidden"
              style={{ borderCollapse: 'separate', borderSpacing: 0, borderRadius: '12px' }}
            >
              <thead>
                <tr>
                  <th className="border-b-2 border-r-2 border-black p-0.5 px-2 bg-transparent" rowSpan={2}></th>
                  <th className="border-b-2 border-r-2 border-black p-0.5 px-2 bg-transparent text-lg" colSpan={3}>OD</th>
                  <th className="border-b-2 border-r-2 border-black p-0.5 px-2 bg-transparent text-lg" colSpan={3}>OS</th>
                  <th className="border-b-2 border-black p-0.5 px-2 bg-transparent text-lg" rowSpan={2}>IPD</th>
                </tr>
                <tr>
                  <th className="border-b-2 border-r-2 border-black p-0.5 px-2 bg-transparent text-base">S</th>
                  <th className="border-b-2 border-r-2 border-black p-0.5 px-2 bg-transparent text-base">C</th>
                  <th className="border-b-2 border-r-2 border-black p-0.5 px-2 bg-transparent text-base">A</th>
                  <th className="border-b-2 border-r-2 border-black p-0.5 px-2 bg-transparent text-base">S</th>
                  <th className="border-b-2 border-r-2 border-black p-0.5 px-2 bg-transparent text-base">C</th>
                  <th className="border-b-2 border-r-2 border-black p-0.5 px-2 bg-transparent text-base">A</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border-b-2 border-r-2 border-black py-0.5 px-2 text-base">Distance</td>
                  <td className="border-b-2 border-r-2 border-black py-0.5 px-2 text-base">{formatValue(selectedMeasurement.right_sph)}</td>
                  <td className="border-b-2 border-r-2 border-black py-0.5 px-2 text-base">{formatValue(selectedMeasurement.right_cyl)}</td>
                  <td className="border-b-2 border-r-2 border-black py-0.5 px-2 text-base">{selectedMeasurement.right_axis || ''}</td>
                  <td className="border-b-2 border-r-2 border-black py-0.5 px-2 text-base">{formatValue(selectedMeasurement.left_sph)}</td>
                  <td className="border-b-2 border-r-2 border-black py-0.5 px-2 text-base">{formatValue(selectedMeasurement.left_cyl)}</td>
                  <td className="border-b-2 border-r-2 border-black py-0.5 px-2 text-base">{selectedMeasurement.left_axis || ''}</td>
                  <td className="border-b-2 border-black py-0.5 px-2 text-base">{selectedMeasurement.ipd_distance || ''}</td>
                </tr>
                <tr>
                  <td className="border-r-2 border-black py-0.5 px-2 text-base">Near</td>
                  <td className="border-r-2 border-black py-0.5 px-2 text-base">Add</td>
                  <td className="border-r-2 border-black py-0.5 px-2 text-base" colSpan={2}>{formatValue(selectedMeasurement.right_add)}</td>
                  <td className="border-r-2 border-black py-0.5 px-2 text-base">Add</td>
                  <td className="border-r-2 border-black py-0.5 px-2 text-base" colSpan={2}>{formatValue(selectedMeasurement.left_add)}</td>
                  <td className="py-0.5 px-2 text-base">{selectedMeasurement.ipd_near || ''}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="fixed top-4 right-4 print:hidden z-[110]">
          <button 
            onClick={() => { setIsPrinting(false); setSelectedMeasurement(null); }}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2 hover:bg-slate-800"
          >
            <X size={16} /> Cancel Printing
          </button>
        </div>
      </div>
    );

    return createPortal(printOverlay, document.body);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 print:hidden">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-[#1434A4] rounded-lg">
            <Eye size={20} />
          </div>
          <h3 className="font-bold text-slate-900 text-xl">Eye Measurements</h3>
        </div>
        <button 
          onClick={handleOpenNew}
          className="px-4 py-2 bg-[#1434A4] hover:bg-[#102a83] text-white text-sm font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus size={16} /> New Measurement
        </button>
      </div>

      {eyeMeasurements.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100 border-dashed flex flex-col items-center">
          <Eye size={48} className="text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">No eye measurements recorded for this patient.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {eyeMeasurements.map((m, index) => (
            <div key={m.id} className="p-5 border border-slate-200 rounded-xl hover:border-blue-200 transition-colors bg-white relative">
              {index === 0 && (
                <span className="absolute -top-3 -right-3 bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 shadow-sm">
                  Latest Measurement
                </span>
              )}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 pb-4 border-b border-slate-100 gap-4">
                <div>
                  <div className="text-slate-500 text-sm">Date</div>
                  <div className="font-bold text-slate-800">{formatCairoDate(m.created_at)}</div>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <button 
                    onClick={() => handleOpenEdit(m)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-[#1434A4] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-sm font-semibold"
                  >
                    <Edit2 size={16} /> Edit
                  </button>
                  <button 
                    onClick={() => handlePrint(m)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-semibold"
                  >
                    <Printer size={16} /> Print
                  </button>
                  <button 
                    onClick={() => handleDelete(m.id)}
                    disabled={isDeleting === m.id}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors text-sm font-semibold"
                    suppressHydrationWarning
                  >
                    {isDeleting === m.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" dir="ltr">
                {/* Right Eye */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="font-bold text-[#1434A4] text-center mb-3 pb-2 border-b border-slate-200" dir="ltr">OD (Right Eye)</div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-500 text-xs font-semibold">SPH</span>
                    <span className="font-mono font-bold text-slate-800" dir="ltr">{m.right_sph ?? '-'}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-500 text-xs font-semibold">CYL</span>
                    <span className="font-mono font-bold text-slate-800" dir="ltr">{m.right_cyl ?? '-'}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-500 text-xs font-semibold">AXIS</span>
                    <span className="font-mono font-bold text-slate-800" dir="ltr">{m.right_axis ?? '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs font-semibold">ADD</span>
                    <span className="font-mono font-bold text-slate-800" dir="ltr">{m.right_add ?? '-'}</span>
                  </div>
                </div>

                {/* Left Eye */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="font-bold text-[#1434A4] text-center mb-3 pb-2 border-b border-slate-200" dir="ltr">OS (Left Eye)</div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-500 text-xs font-semibold">SPH</span>
                    <span className="font-mono font-bold text-slate-800" dir="ltr">{m.left_sph ?? '-'}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-500 text-xs font-semibold">CYL</span>
                    <span className="font-mono font-bold text-slate-800" dir="ltr">{m.left_cyl ?? '-'}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-500 text-xs font-semibold">AXIS</span>
                    <span className="font-mono font-bold text-slate-800" dir="ltr">{m.left_axis ?? '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs font-semibold">ADD</span>
                    <span className="font-mono font-bold text-slate-800" dir="ltr">{m.left_add ?? '-'}</span>
                  </div>
                </div>
              </div>

              {(m.ipd_distance || m.ipd_near) && (
                <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-around" dir="ltr">
                  <div className="text-center">
                    <span className="text-slate-500 text-xs font-semibold block mb-1">IPD Distance</span>
                    <span className="font-mono font-bold text-slate-800">{m.ipd_distance ?? '-'}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-slate-500 text-xs font-semibold block mb-1">IPD Near</span>
                    <span className="font-mono font-bold text-slate-800">{m.ipd_near ?? '-'}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">
                {isEditing ? 'Edit Eye Measurements' : 'Add New Measurement'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
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
                      type="number" step="0.25" name="right_sph"
                      defaultValue={editData?.right_sph ?? ''}
                      placeholder="-1.25" dir="ltr"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1434A4] outline-none transition-all text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1" dir="ltr">CYL</label>
                    <input 
                      type="number" step="0.25" name="right_cyl"
                      defaultValue={editData?.right_cyl ?? ''}
                      placeholder="-0.50" dir="ltr"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1434A4] outline-none transition-all text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1" dir="ltr">AXIS</label>
                    <input 
                      type="number" name="right_axis"
                      defaultValue={editData?.right_axis ?? ''}
                      placeholder="180" dir="ltr"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1434A4] outline-none transition-all text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1" dir="ltr">ADD</label>
                    <input 
                      type="number" step="0.25" name="right_add"
                      defaultValue={editData?.right_add ?? ''}
                      placeholder="0.00" dir="ltr"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1434A4] outline-none transition-all text-center"
                    />
                  </div>
                </div>

                {/* Left Eye */}
                <div className="space-y-4">
                  <div className="font-bold text-[#1434A4] border-b border-blue-100 pb-2 text-center" dir="ltr">OS (Left Eye)</div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1" dir="ltr">SPH</label>
                    <input 
                      type="number" step="0.25" name="left_sph"
                      defaultValue={editData?.left_sph ?? ''}
                      placeholder="-1.25" dir="ltr"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1434A4] outline-none transition-all text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1" dir="ltr">CYL</label>
                    <input 
                      type="number" step="0.25" name="left_cyl"
                      defaultValue={editData?.left_cyl ?? ''}
                      placeholder="-0.50" dir="ltr"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1434A4] outline-none transition-all text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1" dir="ltr">AXIS</label>
                    <input 
                      type="number" name="left_axis"
                      defaultValue={editData?.left_axis ?? ''}
                      placeholder="180" dir="ltr"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1434A4] outline-none transition-all text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1" dir="ltr">ADD</label>
                    <input 
                      type="number" step="0.25" name="left_add"
                      defaultValue={editData?.left_add ?? ''}
                      placeholder="0.00" dir="ltr"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1434A4] outline-none transition-all text-center"
                    />
                  </div>
                </div>

              </div>

              {/* IPD Modal Inputs */}
              <div className="grid grid-cols-2 gap-6 mb-6 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1" dir="ltr">IPD Distance</label>
                  <input 
                    type="number" step="1" name="ipd_distance"
                    defaultValue={editData?.ipd_distance ?? ''}
                    placeholder="66" dir="ltr"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1434A4] outline-none transition-all text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1" dir="ltr">IPD Near</label>
                  <input 
                    type="number" step="1" name="ipd_near"
                    defaultValue={editData?.ipd_near ?? ''}
                    placeholder="64" dir="ltr"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1434A4] outline-none transition-all text-center"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 flex justify-center items-center gap-2 px-4 py-2 text-white bg-[#1434A4] hover:bg-[#102a83] rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <Save size={18} />
                  {isLoading ? 'Saving...' : 'Save Measurements'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
