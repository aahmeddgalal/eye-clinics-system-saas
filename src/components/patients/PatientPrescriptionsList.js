'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Pill, Printer, FileText, X, Edit2, Save, Plus, Loader2, Trash2 } from 'lucide-react'
import { formatCairoDate } from '@/utils/timezone'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Autocomplete from '@/components/ui/Autocomplete'
import { createMedicationInlineAction } from '@/app/dashboard/medications/actions'
import { createDiseaseInlineAction } from '@/app/dashboard/diseases/actions'
import { updatePrescriptionAction, deletePrescriptionAction } from '@/app/dashboard/patients/actions'

function EditPrescriptionForm({ rx, patient, medications: initialMeds, diseases: initialDiseases, onSave, onCancel }) {
  const [medicationsList, setMedicationsList] = useState(initialMeds)
  const [diseasesList, setDiseasesList] = useState(initialDiseases)

  const [diagnosis, setDiagnosis] = useState(rx.visits?.diagnosis || '')
  const [selectedMedications, setSelectedMedications] = useState(rx.medications_data || [])
  const [currentMed, setCurrentMed] = useState({ name: '', dosage: '', duration: '', frequency: '', timing: '', notes: '', instructions: '' })
  const [editingMedIndex, setEditingMedIndex] = useState(null)
  const [doctorNotes, setDoctorNotes] = useState(rx.doctor_notes || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleAddNewMedication = async (name) => {
    const res = await createMedicationInlineAction(name)
    if (res.success && res.data) {
      setMedicationsList([...medicationsList, res.data])
      setCurrentMed({ ...currentMed, name: res.data.name })
    }
  }

  const handleAddNewDisease = async (name) => {
    const res = await createDiseaseInlineAction(name)
    if (res.success && res.data) {
      setDiseasesList([...diseasesList, res.data])
      setDiagnosis(res.data.name)
    }
  }

  const handleAddMedication = () => {
    if (!currentMed.name) return
    if (editingMedIndex !== null) {
      const newMeds = [...selectedMedications]
      newMeds[editingMedIndex] = { ...currentMed }
      setSelectedMedications(newMeds)
      setEditingMedIndex(null)
    } else {
      setSelectedMedications([...selectedMedications, { ...currentMed }])
    }
    setCurrentMed({ name: '', dosage: '', frequency: '', duration: '', timing: '', notes: '', instructions: '' })
  }

  const handleEditMedication = (index) => {
    setCurrentMed({ ...selectedMedications[index] })
    setEditingMedIndex(index)
  }

  const handleRemoveMedication = (index) => {
    const newMeds = [...selectedMedications]
    newMeds.splice(index, 1)
    setSelectedMedications(newMeds)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await updatePrescriptionAction(rx.id, rx.visit_id, patient.id, selectedMedications, doctorNotes, diagnosis)
      setIsSaving(false)

      if (result.error) {
        console.error("Client Error updating prescription:", result)
        toast.error(`Error: ${result.error}${result.code ? ` (Code: ${result.code})` : ''}`, { duration: 6000 })
      } else {
        toast.success('Changes saved successfully')
        // Pass the updated Rx back up so the modal updates instantly
        onSave({
          ...rx,
          medications_data: selectedMedications,
          doctor_notes: doctorNotes,
          visits: { ...rx.visits, diagnosis }
        })
      }
    } catch (err) {
      setIsSaving(false)
      console.error("Client Exception during update:", err)
      toast.error(`Unexpected error: ${err.message}`, { duration: 6000 })
    }
  }

  return (
    <div className="p-6 space-y-6">

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Diagnosis</label>
        <Autocomplete
          items={diseasesList}
          value={diagnosis}
          onChange={setDiagnosis}
          onAddNew={handleAddNewDisease}
          placeholder="Search diagnosis..."
          itemName="diagnosis"
        />
      </div>

      <div className="bg-[#1434A4]/5 p-4 rounded-xl border border-[#1434A4]/10 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Medication Name</label>
          <Autocomplete
            items={medicationsList}
            value={currentMed.name}
            onChange={val => setCurrentMed({ ...currentMed, name: val })}
            onAddNew={handleAddNewMedication}
            placeholder="Search medication..."
            itemName="medication"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Dosage</label>
            <div className="flex gap-2">
              {!(currentMed.dosage && (currentMed.dosage.includes('قطرة') || currentMed.dosage.includes('قطره') || currentMed.dosage.toLowerCase().includes('drop') || currentMed.dosage.toLowerCase().includes('ointment') || currentMed.dosage.includes('مرهم'))) && (
                <input suppressHydrationWarning
                  type="number"
                  step="any"
                  value={currentMed.dosage ? (currentMed.dosage.match(/^([\d.,]+)\s*(.*)$/) ? currentMed.dosage.match(/^([\d.,]+)\s*(.*)$/)[1] : '') : ''}
                  onChange={e => {
                    const match = currentMed.dosage ? currentMed.dosage.match(/^([\d.,]+)\s*(.*)$/) : null;
                    const unit = match ? match[2] : currentMed.dosage || '';
                    setCurrentMed({ ...currentMed, dosage: `${e.target.value} ${unit}`.trim() });
                  }}
                  placeholder="Qty"
                  className="w-1/3 px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-white text-[#111827] placeholder-[#9CA3AF] text-sm text-center"
                  dir="ltr"
                />
              )}
              <input suppressHydrationWarning
                type="text"
                list="dosage-unit-options"
                value={currentMed.dosage ? (currentMed.dosage.match(/^([\d.,]+)\s*(.*)$/) ? currentMed.dosage.match(/^([\d.,]+)\s*(.*)$/)[2] : currentMed.dosage) : ''}
                onChange={e => {
                  const match = currentMed.dosage ? currentMed.dosage.match(/^([\d.,]+)\s*(.*)$/) : null;
                  const amount = match ? match[1] : '';
                  setCurrentMed({ ...currentMed, dosage: `${amount} ${e.target.value}`.trim() });
                }}
                placeholder="Type (tablet, drop...)"
                className={`${(currentMed.dosage && (currentMed.dosage.includes('قطرة') || currentMed.dosage.includes('قطره') || currentMed.dosage.toLowerCase().includes('drop') || currentMed.dosage.toLowerCase().includes('ointment') || currentMed.dosage.includes('مرهم'))) ? 'w-full' : 'w-2/3'} px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-white text-[#111827] placeholder-[#9CA3AF] text-sm`}
              />
            </div>
            <datalist id="dosage-unit-options">
              <option value="drop" />
              <option value="ointment" />
              <option value="tablet" />
              <option value="capsule" />
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Duration</label>
            <div className="flex gap-2">
              <input suppressHydrationWarning
                type="number"
                step="any"
                value={currentMed.duration ? (currentMed.duration.match(/^([\d.,]+)\s*(.*)$/) ? currentMed.duration.match(/^([\d.,]+)\s*(.*)$/)[1] : '') : ''}
                onChange={e => {
                  const match = currentMed.duration ? currentMed.duration.match(/^([\d.,]+)\s*(.*)$/) : null;
                  const unit = match ? match[2] : currentMed.duration || '';
                  setCurrentMed({ ...currentMed, duration: `${e.target.value} ${unit}`.trim() });
                }}
                placeholder="Qty"
                className="w-1/3 px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-white text-[#111827] placeholder-[#9CA3AF] text-sm text-center"
                dir="ltr"
              />
              <input suppressHydrationWarning
                type="text"
                list="duration-unit-options"
                value={currentMed.duration ? (currentMed.duration.match(/^([\d.,]+)\s*(.*)$/) ? currentMed.duration.match(/^([\d.,]+)\s*(.*)$/)[2] : currentMed.duration) : ''}
                onChange={e => {
                  const match = currentMed.duration ? currentMed.duration.match(/^([\d.,]+)\s*(.*)$/) : null;
                  const amount = match ? match[1] : '';
                  setCurrentMed({ ...currentMed, duration: `${amount} ${e.target.value}`.trim() });
                }}
                placeholder="Type (days, months...)"
                className="w-2/3 px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-white text-[#111827] placeholder-[#9CA3AF] text-sm"
              />
            </div>
            <datalist id="duration-unit-options">
              <option value="days" />
              <option value="weeks" />
              <option value="months" />
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Frequency</label>
            <div className="flex gap-2">
              <input suppressHydrationWarning
                type="number"
                step="any"
                value={currentMed.frequency ? (currentMed.frequency.match(/^([\d.,]+)\s*(.*)$/) ? currentMed.frequency.match(/^([\d.,]+)\s*(.*)$/)[1] : '') : ''}
                onChange={e => {
                  const match = currentMed.frequency ? currentMed.frequency.match(/^([\d.,]+)\s*(.*)$/) : null;
                  const unit = match ? match[2] : currentMed.frequency || '';
                  setCurrentMed({ ...currentMed, frequency: `${e.target.value} ${unit}`.trim() });
                }}
                placeholder="Qty"
                className="w-1/3 px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-white text-[#111827] placeholder-[#9CA3AF] text-sm text-center"
                dir="ltr"
              />
              <input suppressHydrationWarning
                type="text"
                list="frequency-unit-options"
                value={currentMed.frequency ? (currentMed.frequency.match(/^([\d.,]+)\s*(.*)$/) ? currentMed.frequency.match(/^([\d.,]+)\s*(.*)$/)[2] : currentMed.frequency) : ''}
                onChange={e => {
                  const match = currentMed.frequency ? currentMed.frequency.match(/^([\d.,]+)\s*(.*)$/) : null;
                  const amount = match ? match[1] : '';
                  setCurrentMed({ ...currentMed, frequency: `${amount} ${e.target.value}`.trim() });
                }}
                placeholder="Type (times, hours...)"
                className="w-2/3 px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-white text-[#111827] placeholder-[#9CA3AF] text-sm"
              />
            </div>
            <datalist id="frequency-unit-options">
              <option value="times daily" />
              <option value="hours" />
              <option value="days" />
            </datalist>
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Timing</label>
          <div className="flex flex-wrap gap-2" dir="rtl">
            {['قبل الأكل', 'بعد الأكل', 'قبل النوم'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setCurrentMed({ ...currentMed, timing: currentMed.timing === t ? '' : t })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${currentMed.timing === t ? 'bg-[#1434A4] text-white border-[#1434A4]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <button suppressHydrationWarning
          type="button"
          onClick={handleAddMedication}
          disabled={!currentMed.name}
          className="w-full py-2 bg-white border border-[#1434A4] text-[#1434A4] rounded-lg text-sm font-bold hover:bg-blue-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {editingMedIndex !== null ? <Edit2 size={16} /> : <Plus size={16} />}
          {editingMedIndex !== null ? 'Update Medication' : 'Add to Prescription'}
        </button>
      </div>

      <div className="min-h-[150px] border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50">
        {selectedMedications.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            No medications added yet.
          </div>
        ) : (
          <ul className="space-y-3">
            {selectedMedications.map((med, idx) => (
              <li key={idx} className="flex items-start justify-between bg-white p-3 rounded border border-slate-100 shadow-sm">
                <div>
                  <div className="font-semibold text-slate-800 text-sm">{med.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 flex-wrap">
                    {med.dosage && <span>{med.dosage} • </span>}
                    {med.frequency && <span>{med.frequency} • </span>}
                    {med.duration && <span>{med.duration} • </span>}
                    {med.instructions && <span className="italic">{med.instructions}</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button suppressHydrationWarning
                    type="button"
                    onClick={() => handleEditMedication(idx)}
                    className="text-slate-400 hover:text-[#1434A4] p-1 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button suppressHydrationWarning
                    type="button"
                    onClick={() => handleRemoveMedication(idx)}
                    className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Doctor Notes (Optional)</label>
        <textarea suppressHydrationWarning
          value={doctorNotes}
          onChange={e => setDoctorNotes(e.target.value)}
          rows={3}
          placeholder="Will be printed at the bottom of the prescription..."
          className="w-full px-4 py-2.5 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-white text-[#111827] placeholder-[#9CA3AF] text-sm resize-none"
          suppressHydrationWarning
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button suppressHydrationWarning
          onClick={onCancel}
          className="px-6 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-colors"
        >
          Cancel
        </button>
        <button suppressHydrationWarning
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-[#1434A4] text-white font-bold rounded-lg hover:bg-[#102a83] transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
        </button>
      </div>
    </div>
  )
}

export default function PatientPrescriptionsList({ patient, prescriptions, medications = [], diseases = [] }) {
  const router = useRouter()
  const [selectedRx, setSelectedRx] = useState(null) // For Modal
  const [isEditing, setIsEditing] = useState(false) // For Edit Mode
  const [isPrinting, setIsPrinting] = useState(false) // For Print View
  const [printRx, setPrintRx] = useState(null)

  const doctorName = "Dr. Sabry"

  useEffect(() => {
    if (isPrinting && printRx) {
      const timer = setTimeout(() => window.print(), 500)
      const handleAfterPrint = () => {
        setIsPrinting(false)
        setPrintRx(null)
      }
      window.addEventListener('afterprint', handleAfterPrint)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('afterprint', handleAfterPrint)
      }
    }
  }, [isPrinting, printRx])

  const handlePrint = (rx) => {
    setPrintRx(rx)
    setIsPrinting(true)
  }

  // Get latest eye measurement
  const latestEyeMeasurement = patient.eye_measurements?.length > 0
    ? [...patient.eye_measurements].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
    : null

  // Print View Overlay
  if (isPrinting && printRx && typeof document !== 'undefined') {
    const ITEMS_PER_PAGE = 7;
    const allMeds = printRx.medications_data || [];
    
    // Chunk medications
    const pages = [];
    if (allMeds.length === 0) {
      pages.push([]);
    } else {
      for (let i = 0; i < allMeds.length; i += ITEMS_PER_PAGE) {
        pages.push(allMeds.slice(i, i + ITEMS_PER_PAGE));
      }
    }

    const printOverlay = (
      <div id="print-mount" className="fixed inset-0 bg-white z-[100] flex justify-center w-full overflow-y-auto min-h-screen print:static print:block print:overflow-visible">
        <style dangerouslySetInnerHTML={{
          __html: `
          @media print {
            @page { 
              size: 148mm 210mm; 
              margin-top: 4.5cm;
              margin-bottom: 3.5cm;
              margin-right: 1.0cm;
              margin-left: 1.5cm;
            }
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
            .print-page {
              page-break-after: always;
              break-after: page;
            }
            .print-page:last-child {
              page-break-after: auto;
              break-after: auto;
            }
          }
        `}} />

        <div className="w-full flex flex-col items-center gap-8 py-8 print:py-0 print:gap-0 print:block">
          {pages.map((pageMeds, pageIndex) => (
            <div
              key={pageIndex}
              className="print-page w-[148mm] min-h-[210mm] print:min-h-0 print:block bg-white text-slate-900 pt-[3.5cm] pb-[4.0cm] pr-[0.5cm] pl-[1.0cm] print:p-0 print:w-full flex flex-col mx-auto relative shadow-2xl print:shadow-none print:m-0 border border-slate-200 print:border-none"
              dir="rtl"
            >
              {/* Patient Details Header */}
              <div className="flex justify-between items-start mb-8 text-[16px] font-bold text-black w-full" style={{ fontFamily: "'Traditional Arabic', Arial, sans-serif" }}>
                {/* Right Side: Patient Data */}
                <div className="text-right whitespace-nowrap" dir="rtl" style={{ lineHeight: '1.8' }}>
                  <div><span className="text-[20px]">الاسم :</span> <span className="mr-1 text-[20px]">{patient?.full_name}</span></div>
                  <div><span>التاريـــخ :</span> <span className="mr-1">{formatCairoDate(new Date(printRx.created_at))}</span></div>
                </div>
                
                {/* Left Side: Diagnosis */}
                {printRx.visits?.visit_diseases && printRx.visits.visit_diseases.length > 0 ? (
                  <div className="text-left text-[14px]" dir="ltr" style={{ fontFamily: "'Times New Roman', serif" }}>
                    Diag: {printRx.visits.visit_diseases.map(vd => vd.diseases?.name).filter(Boolean).join(' • ')}
                  </div>
                ) : <div></div>}
              </div>

              {/* Medications */}
              <div className="mt-4 print:mt-2 flex-1" dir="rtl">
                <ul className="space-y-6 print:space-y-4 w-full">
                  {pageMeds.map((pm, idx) => {
                        // Formatting logic for print
                        let printDosageStr = pm.dosage || '';
                        const dosageMatch = printDosageStr.match(/^([\d.,]+)\s*(.*)$/);
                        if (dosageMatch) {
                          let val = dosageMatch[1];
                          let unit = dosageMatch[2];
                          const lowerUnit = unit.toLowerCase();

                          if (lowerUnit.includes('قطر') || lowerUnit.includes('drop')) {
                            val = '';
                            unit = 'نقطة';
                          } else if (lowerUnit.includes('tablet')) {
                            const num = parseFloat(val);
                            if (num === 1) { val = ''; unit = 'قرص'; }
                            else if (num === 2) { val = ''; unit = 'قرصين'; }
                            else if (num >= 3 && num <= 10) unit = 'أقراص';
                            else unit = 'قرص';
                          } else if (lowerUnit.includes('capsule')) {
                            const num = parseFloat(val);
                            if (num === 1) { val = ''; unit = 'كبسولة'; }
                            else if (num === 2) { val = ''; unit = 'كبسولتين'; }
                            else if (num >= 3 && num <= 10) unit = 'كبسولات';
                            else unit = 'كبسولة';
                          } else if (lowerUnit.includes('ointment')) {
                            val = '';
                            unit = 'مرهم';
                          } else if (lowerUnit.includes('ampule') || lowerUnit.includes('amp')) {
                            const num = parseFloat(val);
                            if (num === 1) { val = ''; unit = 'حقنة'; }
                            else if (num === 2) { val = ''; unit = 'حقنتين'; }
                            else if (num >= 3 && num <= 10) unit = 'حقن';
                            else unit = 'حقنة';
                          } else if (lowerUnit.includes('nasal drops') || lowerUnit.includes('nasal drop')) {
                            val = '';
                            unit = 'نقطة للأنف';
                          }
                          
                          printDosageStr = val ? `${val} ${unit}`.trim() : unit;
                        } else {
                          const lowerDosage = printDosageStr.toLowerCase();
                          if (lowerDosage.includes('قطر') || lowerDosage.includes('drop')) {
                            printDosageStr = 'نقطة';
                          } else if (lowerDosage.includes('tablet')) {
                            printDosageStr = 'قرص';
                          } else if (lowerDosage.includes('capsule')) {
                            printDosageStr = 'كبسولة';
                          } else if (lowerDosage.includes('ointment')) {
                            printDosageStr = 'مرهم';
                          } else if (lowerDosage.includes('ampule') || lowerDosage.includes('amp')) {
                            printDosageStr = 'حقنة';
                          } else if (lowerDosage.includes('nasal drops') || lowerDosage.includes('nasal drop')) {
                            printDosageStr = 'نقطة للأنف';
                          }
                        }

                        let printDurationStr = pm.duration || '';
                        let printFreqStr = pm.frequency || '';
                        let isTapering = printFreqStr.startsWith("Tapering: starts at") || printFreqStr.startsWith("تدريجي: يبدأ بـ");

                        if (isTapering) {
                          let tStart = printFreqStr.replace("Tapering: starts at", "").replace("تدريجي: يبدأ بـ", "").trim();
                          
                          const tStartMatch = tStart.match(/^([\d.]+)\s*(.*)$/);
                          if (tStartMatch) {
                            const val = parseFloat(tStartMatch[1]);
                            const unit = tStartMatch[2].toLowerCase();
                            
                            if (unit.includes('times daily') || unit.includes('time daily')) {
                              if (val === 1) tStart = 'مرة يومياً';
                              else if (val === 2) tStart = 'مرتين يومياً';
                              else if (val >= 3 && val <= 10) tStart = `${val} مرات يومياً`;
                              else tStart = `${val} مرة يومياً`;
                            } else if (unit.includes('drops daily') || unit.includes('drop daily')) {
                              if (val === 1) tStart = 'نقطة يومياً';
                              else if (val === 2) tStart = 'نقطتين يومياً';
                              else if (val >= 3 && val <= 10) tStart = `${val} نقط يومياً`;
                              else tStart = `${val} نقطة يومياً`;
                            }
                          } else {
                            tStart = tStart.replace("drops daily", "نقط يومياً").replace("times daily", "مرات يومياً");
                          }
                          
                          let tRate = printDurationStr.replace("Dose reduction every", "").replace("تخفيض الجرعة", "").trim();
                          const rMatch = tRate.match(/^([\d.]+)\s*(.*)$/);
                          if (rMatch) {
                            const val = parseFloat(rMatch[1]);
                            const u = rMatch[2].toLowerCase();
                            if (u.includes('week') || u.includes('اسبوع') || u.includes('أسبوع')) {
                              if (val === 1) tRate = 'أسبوع';
                              else if (val === 2) tRate = 'أسبوعين';
                              else if (val >= 3 && val <= 10) tRate = `${val} أسابيع`;
                              else tRate = `${val} أسبوع`;
                            } else if (u.includes('day') || u.includes('يوم')) {
                              if (val === 1) tRate = 'يوم';
                              else if (val === 2) tRate = 'يومين';
                              else if (val >= 3 && val <= 10) tRate = `${val} أيام`;
                              else tRate = `${val} يوم`;
                            }
                          }
                          printFreqStr = `تدريجي: ${tStart}، وتقل كل ${tRate}`;
                          printDurationStr = '';
                        } else {
                          const durMatch = printDurationStr.match(/^([\d.]+)\s*(.*)$/);
                          if (durMatch) {
                            const val = parseFloat(durMatch[1]);
                            const unitStr = durMatch[2].toLowerCase();
                            
                            if (unitStr.includes('يوم') || unitStr.includes('day')) {
                              if (val === 1) printDurationStr = 'يوم';
                              else if (val === 2) printDurationStr = 'يومين';
                              else if (val >= 3 && val <= 10) printDurationStr = `${val} أيام`;
                              else printDurationStr = `${val} يوم`;
                            } else if (unitStr.includes('اسبوع') || unitStr.includes('week') || unitStr.includes('اسابيع') || unitStr.includes('أسابيع') || unitStr.includes('أسبوع')) {
                              if (val === 1) printDurationStr = 'أسبوع';
                              else if (val === 2) printDurationStr = 'أسبوعين';
                              else if (val >= 3 && val <= 10) printDurationStr = `${val} أسابيع`;
                              else printDurationStr = `${val} أسبوع`;
                            } else if (unitStr.includes('شهر') || unitStr.includes('month') || unitStr.includes('شهور')) {
                              if (val === 1) printDurationStr = 'شهر';
                              else if (val === 2) printDurationStr = 'شهرين';
                              else if (val >= 3 && val <= 10) printDurationStr = `${val} شهور`;
                              else printDurationStr = `${val} شهر`;
                            }
                          }

                          const freqMatch = printFreqStr.match(/^([\d.]+)\s*(.*)$/);
                          if (freqMatch) {
                            const val = parseFloat(freqMatch[1]);
                            const unit = freqMatch[2].toLowerCase();
                            if (unit.includes('times daily') || unit.includes('time daily')) {
                              if (val === 1) printFreqStr = 'مرة يومياً';
                              else if (val === 2) printFreqStr = 'مرتين يومياً';
                              else if (val >= 3 && val <= 10) printFreqStr = `${val} مرات يومياً`;
                              else printFreqStr = `${val} مرة يومياً`;
                            } else if (unit.includes('hours') || unit.includes('hour')) {
                              if (val === 1) printFreqStr = 'كل ساعة';
                              else if (val === 2) printFreqStr = 'كل ساعتين';
                              else if (val >= 3 && val <= 10) printFreqStr = `كل ${val} ساعات`;
                              else printFreqStr = `كل ${val} ساعة`;
                            } else if (unit.includes('days') || unit.includes('day')) {
                              if (val === 1) printFreqStr = 'كل يوم';
                              else if (val === 2) printFreqStr = 'كل يومين';
                              else if (val >= 3 && val <= 10) printFreqStr = `كل ${val} أيام`;
                              else printFreqStr = `كل ${val} يوم`;
                            }
                          } else if (printFreqStr.toLowerCase() === 'times daily' || printFreqStr.toLowerCase() === 'مرة يوميا') {
                              printFreqStr = 'مرة يومياً';
                          } else if (printFreqStr.toLowerCase() === 'days' || printFreqStr.toLowerCase() === 'كل يوم') {
                              printFreqStr = 'كل يوم';
                          }
                        }

                        return (
                        <li key={idx} className="pb-2 print:pb-2 print:mb-2">
                          {/* Screen View */}
                          <div className="flex items-center gap-3 print:hidden">
                            <span className="font-bold text-slate-900 text-lg" dir="ltr">{pm.name}</span>
                            <div className="flex gap-2 items-center">
                              {pm.dosage && <span className="text-sm text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">{pm.dosage}</span>}
                              {pm.frequency && <span className="text-sm text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">{pm.frequency}</span>}
                              {pm.timing && <span className="text-sm text-[#1434A4] bg-blue-50 border border-[#1434A4]/20 px-2 py-0.5 rounded-md">{pm.timing}</span>}
                              {pm.duration && <span className="text-xs text-slate-600 border border-slate-300 px-2 py-0.5 rounded-full">{pm.duration}</span>}
                            </div>
                          </div>
                          {(pm.notes || pm.instructions) && (
                            <p className="text-sm text-slate-600 mt-1 pl-4 pr-4 italic border-r-2 border-slate-300 mr-1 print:hidden">
                              Sig: {pm.notes || pm.instructions}
                            </p>
                          )}

                          {/* Print View */}
                          <div className="hidden print:flex items-center justify-between w-full">
                            {/* Instructions (Right) */}
                            <div className="text-[17px] font-bold leading-relaxed text-right flex-1 pr-2 text-black" style={{ fontFamily: "'Traditional Arabic', Arial, sans-serif" }}>
                              {isTapering 
                                ? `${printDosageStr} ${printFreqStr}`
                                : `${printDosageStr} ${printFreqStr ? printFreqStr : ''} ${pm.timing ? pm.timing : ''} ${printDurationStr ? `لمدة ${printDurationStr}` : ''}`
                              }
                              {(pm.notes || pm.instructions) && (
                                <div className="text-[13px] mt-0.5 font-normal text-black" style={{ fontFamily: "'Traditional Arabic', Arial, sans-serif" }}>
                                  ملاحظة: {pm.notes || pm.instructions}
                                </div>
                              )}
                            </div>
                            
                            {/* Medication Name (Left) */}
                            <div className="text-left w-1/2 pl-2">
                              {(() => {
                                let nameSuffix = '';
                                if (pm.dosage) {
                                  const ds = pm.dosage.toLowerCase();
                                  if (ds.includes('nasal drops') || ds.includes('nasal drop')) {
                                    nameSuffix = ' nasal drops';
                                  } else if (ds.includes('drop') || ds.includes('قطر')) {
                                    nameSuffix = ' eye drops';
                                  } else if (ds.includes('ointment') || ds.includes('مرهم')) {
                                    nameSuffix = ' eye ointment';
                                  } else if (ds.includes('tablet') || ds.includes('قرص')) {
                                    nameSuffix = ' tablets';
                                  } else if (ds.includes('capsule') || ds.includes('كبسول')) {
                                    nameSuffix = ' capsules';
                                  } else if (ds.includes('ampule') || ds.includes('amp') || ds.includes('حقن')) {
                                    nameSuffix = ' ampules';
                                  }
                                }
                                return (
                                  <span className="font-bold text-black text-base" style={{ fontFamily: "'Times New Roman', serif" }} dir="ltr">
                                    {pm.name}{nameSuffix}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                        </li>
                      )})}
                </ul>

                {pageMeds.length === 0 && (
                  <p className="text-slate-400 italic text-sm text-right" dir="rtl">No medications prescribed.</p>
                )}
              </div>

              {/* Doctor Notes (only on the last page) */}
              {pageIndex === pages.length - 1 && printRx.doctor_notes && (
                <div className="mt-8 pt-4 border-t border-slate-100 text-sm print:text-xs text-slate-700 italic">
                  "{printRx.doctor_notes}"
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="fixed top-4 right-4 print:hidden z-[110]">
          <button suppressHydrationWarning
            onClick={() => { setIsPrinting(false); setPrintRx(null); }}
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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-[#1434A4] rounded-lg">
            <Pill size={20} />
          </div>
          <h3 className="font-bold text-slate-900 text-xl">Medical Prescriptions</h3>
        </div>
        {/* <button suppressHydrationWarning 
          onClick={() => window.location.href = `/dashboard/rx-generator`}
          className="text-sm font-medium text-[#1434A4] hover:underline"
        >
          إصدار روشتة
        </button> */}
      </div>

      {prescriptions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prescriptions.map((rx) => (
            <div key={rx.id} className="p-5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-blue-200 transition-colors shadow-sm flex flex-col justify-between group">
              <div>
                <div className="flex justify-between items-center mb-3 border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-500">Issue Date</span>
                  <span className="text-sm font-bold text-slate-800">
                    {formatCairoDate(new Date(rx.created_at))}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="text-sm flex justify-between">
                    <span className="text-slate-500">Visit Title:</span>
                    <span className="font-semibold text-slate-800">{rx.visits?.diagnosis || 'Not recorded'}</span>
                  </div>
                  <div className="text-sm flex justify-between">
                    <span className="text-slate-500">Medications Count:</span>
                    <span className="font-semibold text-slate-800">
                      {rx.medications_data?.length || 0} medications
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                <button suppressHydrationWarning
                  onClick={() => { setSelectedRx(rx); setIsEditing(false); }}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-[#1434A4] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                >
                  <FileText size={14} /> View Details
                </button>
                <button suppressHydrationWarning
                  onClick={() => handlePrint(rx)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100"
                >
                  <Printer size={14} /> Print
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
          <p className="text-sm text-slate-500">No prescriptions issued.</p>
        </div>
      )}

      {/* View Prescription Modal */}
      {selectedRx && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-[#1434A4] rounded-lg">
                  <Pill size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Prescription Details</h2>
                  <p className="text-xs text-slate-500">{formatCairoDate(new Date(selectedRx.created_at))}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <button suppressHydrationWarning
                    onClick={() => handlePrint(selectedRx)}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Print"
                  >
                    <Printer size={20} />
                  </button>
                )}
                {!isEditing && (
                  <button suppressHydrationWarning
                    onClick={async () => {
                      if (confirm('Are you sure you want to delete this prescription? (You can restore it from the trash)')) {
                        const res = await deletePrescriptionAction(selectedRx.id, patient.id);
                        if (res.success) {
                          toast.success('Prescription deleted successfully');
                          setSelectedRx(null);
                          router.refresh();
                        } else {
                          toast.error('Error occurred while deleting');
                        }
                      }
                    }}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Prescription"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                <button suppressHydrationWarning
                  onClick={() => { setSelectedRx(null); setIsEditing(false); }}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {isEditing ? (
              <EditPrescriptionForm
                rx={selectedRx}
                patient={patient}
                medications={medications}
                diseases={diseases}
                onSave={(updatedRx) => {
                  setIsEditing(false)
                  if (updatedRx) {
                    setSelectedRx(updatedRx)
                    router.refresh()
                  }
                }}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <div className="p-6 space-y-6">

                {/* Patient Info Card */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Patient Name</p>
                    <p className="font-bold text-slate-900">{patient.full_name}</p>
                  </div>
                  <div className="text-end">
                    <p className="text-xs text-slate-500 mb-1">Visit Title</p>
                    <p className="font-bold text-[#1434A4]">{selectedRx.visits?.diagnosis || 'Not recorded'}</p>
                  </div>
                </div>

                {/* Medications List */}
                <div>
                  <h3 className="font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">Prescribed Medications</h3>
                  {selectedRx.medications_data?.length > 0 ? (
                    <ul className="space-y-3">
                      {selectedRx.medications_data.map((pm, idx) => (
                        <li key={idx} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-slate-800">{pm.name}</span>
                            <div className="flex gap-1 flex-wrap">
                              {pm.duration && <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-full">{pm.duration}</span>}
                              {pm.frequency && <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">{pm.frequency}</span>}
                              {pm.dosage && <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">{pm.dosage}</span>}
                            </div>
                          </div>
                          {pm.notes && (
                            <p className="text-sm text-slate-600 italic">Notes: {pm.notes}</p>
                          )}
                          {pm.instructions && !pm.notes && (
                            <p className="text-sm text-slate-600 italic">Instructions: {pm.instructions}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No medications recorded in this prescription.</p>
                  )}
                </div>

                {/* Doctor Notes */}
                {selectedRx.doctor_notes && (
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2 border-b border-slate-100 pb-2">Doctor Notes</h3>
                    <div className="bg-blue-50/50 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap border border-blue-100">
                      {selectedRx.doctor_notes}
                    </div>
                  </div>
                )}

                {/* Eye Measurements */}
                {latestEyeMeasurement && (
                  <div>
                    <h3 className="font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">Latest Eye Measurements (At Time of Rx)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                        <div className="text-xs font-bold text-slate-400 text-center mb-2 border-b pb-1" dir="ltr">OD (Right)</div>
                        <div className="text-sm flex justify-between"><span className="text-slate-400 text-xs">SPH</span><span className="font-bold" dir="ltr">{latestEyeMeasurement.right_sph ?? '-'}</span></div>
                        <div className="text-sm flex justify-between mt-1"><span className="text-slate-400 text-xs">CYL</span><span className="font-bold" dir="ltr">{latestEyeMeasurement.right_cyl ?? '-'}</span></div>
                        <div className="text-sm flex justify-between mt-1"><span className="text-slate-400 text-xs">AXS</span><span className="font-bold" dir="ltr">{latestEyeMeasurement.right_axis ?? '-'}</span></div>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                        <div className="text-xs font-bold text-slate-400 text-center mb-2 border-b pb-1" dir="ltr">OS (Left)</div>
                        <div className="text-sm flex justify-between"><span className="text-slate-400 text-xs">SPH</span><span className="font-bold" dir="ltr">{latestEyeMeasurement.left_sph ?? '-'}</span></div>
                        <div className="text-sm flex justify-between mt-1"><span className="text-slate-400 text-xs">CYL</span><span className="font-bold" dir="ltr">{latestEyeMeasurement.left_cyl ?? '-'}</span></div>
                        <div className="text-sm flex justify-between mt-1"><span className="text-slate-400 text-xs">AXS</span><span className="font-bold" dir="ltr">{latestEyeMeasurement.left_axis ?? '-'}</span></div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
