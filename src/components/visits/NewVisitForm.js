'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, X, Pill, Activity, CheckCircle2, Eye, Edit2 } from 'lucide-react'
import { createFullVisitAction, updateFullVisitAction } from '@/app/dashboard/visits/actions'
import Autocomplete from '@/components/ui/Autocomplete'
import { createMedicationInlineAction } from '@/app/dashboard/medications/actions'
import { createDiseaseInlineAction } from '@/app/dashboard/diseases/actions'
import toast from 'react-hot-toast'

export default function NewVisitForm({ patientId, diseasesCatalog, medicationsCatalog, initialVisit = null }) {
  const router = useRouter()
  const isEditing = !!initialVisit
  
  const [diseases, setDiseases] = useState(diseasesCatalog)
  const [medications, setMedications] = useState(medicationsCatalog)
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Main Diagnosis State
  const [mainDiagnosis, setMainDiagnosis] = useState(initialVisit?.diagnosis || '')

  // Disease Selection State
  const initialDiseases = initialVisit?.visit_diseases?.map(vd => vd.diseases).filter(Boolean) || []
  const [selectedDiseases, setSelectedDiseases] = useState(initialDiseases)
  const [diseaseInput, setDiseaseInput] = useState('')

  // Medication Selection State
  const initialMedications = initialVisit?.prescriptions?.[0]?.medications_data || []
  const [selectedMedications, setSelectedMedications] = useState(initialMedications)
  const [currentMed, setCurrentMed] = useState({ id: '', name: '', dosage: '', frequency: '', duration: '', timing: '', notes: '', instructions: '', isTapering: false, taperStart: '', taperRate: '' })
  const [editingMedId, setEditingMedId] = useState(null)

  const handleAddDisease = (name) => {
    if (!name) return
    const disease = diseases.find(d => d.name === name)
    if (disease) {
      if (!selectedDiseases.find(d => d.id === disease.id)) {
        setSelectedDiseases([...selectedDiseases, disease])
      }
      setDiseaseInput('') 
    } else {
      toast.error("This disease does not exist. Click 'Add New' from the list.")
    }
  }

  const handleAddNewMainDiagnosis = async (name) => {
    const res = await createDiseaseInlineAction(name)
    if (res.success && res.data) {
      setDiseases([...diseases, res.data])
      setMainDiagnosis(res.data.name)
    }
  }

  const handleAddNewDisease = async (name) => {
    const res = await createDiseaseInlineAction(name)
    if (res.success && res.data) {
      setDiseases([...diseases, res.data])
      setSelectedDiseases([...selectedDiseases, res.data])
      setDiseaseInput('')
    }
  }

  const handleRemoveDisease = (id) => {
    setSelectedDiseases(selectedDiseases.filter(d => d.id !== id))
  }

  const handleAddNewMedication = async (name) => {
    const res = await createMedicationInlineAction(name)
    if (res.success && res.data) {
      setMedications([...medications, res.data])
      setCurrentMed({ ...currentMed, id: res.data.id, name: res.data.name })
    }
  }

  const handleAddMedication = () => {
    let medObj = medications.find(m => m.id === currentMed.id || m.name === currentMed.name)
    if (!medObj) return // Requires selecting or adding first
    
    if (editingMedId) {
      // We are editing an existing entry
      const newMeds = selectedMedications.map(m => {
        if (m.medication_id === editingMedId) {
          return {
            medication_id: medObj.id,
            name: medObj.name,
            dosage: currentMed.dosage,
            frequency: currentMed.isTapering ? `Tapering: starts at ${currentMed.taperStart}` : currentMed.frequency,
            duration: currentMed.isTapering ? `Dose reduction every ${currentMed.taperRate}` : currentMed.duration,
            isTapering: currentMed.isTapering,
            taperStart: currentMed.taperStart,
            taperRate: currentMed.taperRate,
            timing: currentMed.timing,
            notes: currentMed.notes,
            instructions: currentMed.instructions
          }
        }
        return m
      })
      setSelectedMedications(newMeds)
      setEditingMedId(null)
    } else {
      // Check if already added to avoid duplicates
      if (selectedMedications.find(m => m.medication_id === medObj.id)) {
        alert("This medication is already in the prescription.")
        return
      }

      setSelectedMedications([
        ...selectedMedications, 
        {
          medication_id: medObj.id,
          name: medObj.name,
          dosage: currentMed.dosage,
          frequency: currentMed.isTapering ? `Tapering: starts at ${currentMed.taperStart}` : currentMed.frequency,
          duration: currentMed.isTapering ? `Dose reduction every ${currentMed.taperRate}` : currentMed.duration,
          isTapering: currentMed.isTapering,
          taperStart: currentMed.taperStart,
          taperRate: currentMed.taperRate,
          timing: currentMed.timing,
          notes: currentMed.notes,
          instructions: currentMed.instructions
        }
      ])
    }
    
    // Reset form
    setCurrentMed({ id: '', name: '', dosage: '', frequency: '', duration: '', isTapering: false, taperStart: '', taperRate: '' })
  }

  const handleEditMedication = (id) => {
    const medToEdit = selectedMedications.find(m => m.medication_id === id)
    if (medToEdit) {
      setCurrentMed({
        id: medToEdit.medication_id,
        name: medToEdit.name,
        dosage: medToEdit.dosage || '',
        frequency: medToEdit.isTapering ? '' : (medToEdit.frequency || ''),
        duration: medToEdit.duration && medToEdit.duration.startsWith('Dose reduction every') ? '' : (medToEdit.duration || ''),
        isTapering: medToEdit.isTapering || false,
        taperStart: medToEdit.taperStart || '',
        taperRate: medToEdit.taperRate || '',
        timing: medToEdit.timing || '',
        notes: medToEdit.notes || '',
        instructions: medToEdit.instructions || ''
      })
      setEditingMedId(id)
    }
  }

  const handleRemoveMedication = (id) => {
    setSelectedMedications(selectedMedications.filter(m => m.medication_id !== id))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.target)
    
    // Auto-set default visit title if empty
    if (!formData.get('diagnosis') || formData.get('diagnosis').trim() === '') {
      formData.set('diagnosis', 'كشف')
    }
    
    // Append complex states as JSON strings
    formData.append('selected_diseases', JSON.stringify(selectedDiseases.map(d => d.id)))
    formData.append('selected_medications', JSON.stringify(selectedMedications))

    try {
      let result
      if (isEditing) {
        console.log(`Submitting UPDATE for visit: ${initialVisit.id}`)
        result = await updateFullVisitAction(initialVisit.id, patientId, formData)
      } else {
        console.log(`Submitting CREATE for patient: ${patientId}`)
        result = await createFullVisitAction(patientId, formData)
      }

      if (result?.error) {
        setError(result.error)
        toast.error(result.error)
        setIsLoading(false)
      } else {
        setSuccess(true)
        toast.success(isEditing ? "Visit updated successfully" : "Visit added successfully")
        // Small delay so user sees success state before redirect
        setTimeout(() => {
          router.push(`/dashboard/patients/${patientId}`)
          router.refresh()
        }, 800)
      }
    } catch (err) {
      console.error(err)
      toast.error('No internet connection or unable to contact server')
      setError('No internet connection or unable to contact server')
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-emerald-600">
        <CheckCircle2 size={64} className="mb-4 animate-in zoom-in" />
        <h2 className="text-2xl font-bold text-slate-800">{isEditing ? 'Visit updated successfully!' : 'Visit added successfully!'}</h2>
        <p className="text-slate-500 mt-2">Redirecting to patient profile...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="divide-y divide-slate-100">
      
      {isEditing && initialVisit?.updated_at && (
        <input suppressHydrationWarning type="hidden" name="last_updated_at" value={initialVisit.updated_at} />
      )}

      {error && (
        <div className="p-6 pb-0">
          <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        </div>
      )}

      {/* Section 1: Clinical Notes */}
      <div className="p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Activity size={20} className="text-[#1434A4]" />
            Clinical Notes
          </h3>
          <p className="text-sm text-slate-500 mb-6">Record visit title and general examination notes.</p>
          
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Visit Title *</label>
              <input suppressHydrationWarning 
                type="text"
                name="diagnosis"
                value={mainDiagnosis}
                onChange={(e) => setMainDiagnosis(e.target.value)}
                
                className="w-full px-4 py-2.5 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-white text-[#111827] placeholder-[#9CA3AF] text-sm"
                placeholder="Enter a title for the visit (e.g. Checkup, Consultation, ...)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Visit Notes</label>
              <textarea suppressHydrationWarning
                name="notes"
                rows={3}
                defaultValue={initialVisit?.notes || ''}
                className="w-full px-4 py-2.5 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-white text-[#111827] placeholder-[#9CA3AF] text-sm resize-none"
                placeholder="Record any additional notes about the clinical examination or patient complaint here..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Diagnoses (Diseases) */}
      <div className="p-6 sm:p-8 bg-slate-50/50">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
          Select Diagnoses (Diseases)
        </h3>
        <p className="text-sm text-slate-500 mb-6">Add diseases from the clinical diseases list.</p>
        
        <div className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Autocomplete 
                items={diseases}
                value={diseaseInput}
                onChange={setDiseaseInput}
                onAddNew={handleAddNewDisease}
                placeholder="Search diagnosis or add new..."
                itemName="Diagnosis"
              />
            </div>
            <button suppressHydrationWarning 
              type="button"
              onClick={() => handleAddDisease(diseaseInput)}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-[#1434A4] text-white rounded-lg font-bold hover:bg-[#102a83] transition-colors h-[42px]"
            >
              <Plus size={18} /> Add
            </button>
          </div>

          {selectedDiseases.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {selectedDiseases.map(d => (
                <span key={d.id} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-[#1434A4]">
                  {d.name}
                  <button suppressHydrationWarning
                    type="button"
                    onClick={() => handleRemoveDisease(d.id)}
                    className="ms-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section 2.5: Eye Measurements */}
      <div className="p-6 sm:p-8">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
          <Eye size={20} className="text-[#1434A4]" />
          Eye Measurements & Refraction (Optional)
        </h3>
        <p className="text-sm text-slate-500 mb-6">These measurements will be automatically saved in the patient's historical record.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
          
          {/* Left Eye */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-800 border-b pb-2 mb-4 text-center">Left Eye (OS)</h4>
            <div className="grid grid-cols-3 gap-3" dir="ltr">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 text-center">SPH</label>
                  <input suppressHydrationWarning
                    type="number"
                    step="0.25"
                    name="left_sph"
                    defaultValue={initialVisit?.eye_measurements?.[0]?.left_sph || ''}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#1434A4] outline-none bg-white text-sm"
                    placeholder="0.00"
                    dir="ltr"
                  />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 text-center">CYL</label>
                  <input suppressHydrationWarning
                    type="number"
                    step="0.25"
                    name="left_cyl"
                    defaultValue={initialVisit?.eye_measurements?.[0]?.left_cyl || ''}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#1434A4] outline-none bg-white text-sm"
                    placeholder="0.00"
                    dir="ltr"
                  />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 text-center">Axis</label>
                <input suppressHydrationWarning
                  type="number"
                  name="left_axis"
                  defaultValue={initialVisit?.eye_measurements?.[0]?.left_axis || ''}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#1434A4] outline-none bg-white text-sm"
                  placeholder="0"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="max-w-[50%] mx-auto mt-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1 text-center">Add</label>
              <input suppressHydrationWarning
                type="number"
                step="0.25"
                name="left_add"
                defaultValue={initialVisit?.eye_measurements?.[0]?.left_add || ''}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#1434A4] outline-none bg-white text-sm text-center"
                placeholder="0.00"
                dir="ltr"
              />
            </div>
          </div>

          {/* Right Eye */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-800 border-b pb-2 mb-4 text-center">Right Eye (OD)</h4>
            <div className="grid grid-cols-3 gap-3" dir="ltr">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 text-center">SPH</label>
                  <input suppressHydrationWarning
                    type="number"
                    step="0.25"
                    name="right_sph"
                    defaultValue={initialVisit?.eye_measurements?.[0]?.right_sph || ''}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#1434A4] outline-none bg-white text-sm"
                    placeholder="0.00"
                    dir="ltr"
                  />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 text-center">CYL</label>
                  <input suppressHydrationWarning
                    type="number"
                    step="0.25"
                    name="right_cyl"
                    defaultValue={initialVisit?.eye_measurements?.[0]?.right_cyl || ''}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#1434A4] outline-none bg-white text-sm"
                    placeholder="0.00"
                    dir="ltr"
                  />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 text-center">Axis</label>
                <input suppressHydrationWarning
                  type="number"
                  name="right_axis"
                  defaultValue={initialVisit?.eye_measurements?.[0]?.right_axis || ''}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#1434A4] outline-none bg-white text-sm"
                  placeholder="0"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="max-w-[50%] mx-auto mt-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1 text-center">Add</label>
              <input suppressHydrationWarning
                type="number"
                step="0.25"
                name="right_add"
                defaultValue={initialVisit?.eye_measurements?.[0]?.right_add || ''}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#1434A4] outline-none bg-white text-sm text-center"
                placeholder="0.00"
                dir="ltr"
              />
            </div>
          </div>

          {/* IPD */}
          <div className="md:col-span-2 space-y-4 mt-2">
            <h4 className="font-bold text-slate-800 border-b pb-2 mb-4 text-center">Interpupillary Distance (IPD)</h4>
            <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 text-center">Near</label>
                  <input suppressHydrationWarning
                    type="number"
                    step="1"
                    name="ipd_near"
                    defaultValue={initialVisit?.eye_measurements?.[0]?.ipd_near || ''}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#1434A4] outline-none bg-white text-sm text-center"
                    placeholder="64"
                    dir="ltr"
                  />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 text-center">Distance</label>
                  <input suppressHydrationWarning
                    type="number"
                    step="1"
                    name="ipd_distance"
                    defaultValue={initialVisit?.eye_measurements?.[0]?.ipd_distance || ''}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#1434A4] outline-none bg-white text-sm text-center"
                    placeholder="66"
                    dir="ltr"
                  />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Section 3: E-Prescription */}
      <div className="p-6 sm:p-8 bg-slate-50/50">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
          <Pill size={20} className="text-[#1434A4]" />
          E-Prescription
        </h3>
        <p className="text-sm text-slate-500 mb-6">Prescribe medications and dosages.</p>
        
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Medication</label>
              <Autocomplete 
                items={medications}
                value={currentMed.name}
                onChange={(val) => {
                  const med = medications.find(m => m.name === val)
                  setCurrentMed({ ...currentMed, id: med?.id || '', name: val })
                }}
                onAddNew={handleAddNewMedication}
                placeholder="Search medication or add new..."
                itemName="Medication"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Dosage</label>
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
                    placeholder="Amount"
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
                  placeholder="Type (e.g. tablet, drop, قطرة...)"
                  className={`${(currentMed.dosage && (currentMed.dosage.includes('قطرة') || currentMed.dosage.includes('قطره') || currentMed.dosage.toLowerCase().includes('drop') || currentMed.dosage.toLowerCase().includes('ointment') || currentMed.dosage.includes('مرهم'))) ? 'w-full' : 'w-2/3'} px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-white text-[#111827] placeholder-[#9CA3AF] text-sm`}
                />
              </div>
              <datalist id="dosage-unit-options">
                <option value="Drop" />
                <option value="Tablet" />
                <option value="ointment" />
                <option value="Capsule" />
                <option value="ampule" />
                <option value="nasal drops" />
              </datalist>
            </div>
            <div className="md:col-span-2 flex items-center gap-2 mt-2 mb-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
              <input
                type="checkbox"
                id="tapering-toggle"
                checked={currentMed.isTapering}
                onChange={e => setCurrentMed({ ...currentMed, isTapering: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="tapering-toggle" className="text-sm font-semibold text-blue-800 cursor-pointer select-none flex-1">
                Tapering Dosage Regimen
              </label>
            </div>

            {!currentMed.isTapering ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Frequency</label>
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
                      placeholder="Amount"
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
                      placeholder="Unit (e.g. times daily, hours...)"
                      className="w-2/3 px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-white text-[#111827] placeholder-[#9CA3AF] text-sm"
                    />
                  </div>
                  <datalist id="frequency-unit-options">
                    <option value="times daily" />
                    <option value="hours" />
                    <option value="days" />
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Timing</label>
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
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Duration</label>
                  <div className="flex gap-3">
                    <div className="flex gap-2 flex-1">
                      <input suppressHydrationWarning
                        type="number"
                        step="any"
                        value={currentMed.duration ? (currentMed.duration.match(/^([\d.,]+)\s*(.*)$/) ? currentMed.duration.match(/^([\d.,]+)\s*(.*)$/)[1] : '') : ''}
                        onChange={e => {
                          const match = currentMed.duration ? currentMed.duration.match(/^([\d.,]+)\s*(.*)$/) : null;
                          const unit = match ? match[2] : currentMed.duration || '';
                          setCurrentMed({ ...currentMed, duration: `${e.target.value} ${unit}`.trim() });
                        }}
                        placeholder="Amount"
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
                        placeholder="Unit (e.g. days, months...)"
                        className="w-2/3 px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-white text-[#111827] placeholder-[#9CA3AF] text-sm"
                      />
                    </div>
                    <datalist id="duration-unit-options">
                      <option value="days" />
                      <option value="weeks" />
                      <option value="months" />
                    </datalist>
                    <button suppressHydrationWarning
                      type="button"
                      onClick={handleAddMedication}
                      disabled={!currentMed.name}
                      className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors flex items-center gap-1 shrink-0"
                    >
                      {editingMedId ? <Edit2 size={16} /> : <Plus size={16} />} 
                      {editingMedId ? 'Update' : 'Add to Prescription'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Taper Start</label>
                  <div className="flex gap-2">
                    <input suppressHydrationWarning
                      type="number"
                      step="any"
                      value={currentMed.taperStart ? (currentMed.taperStart.match(/^([\d.,]+)\s*(.*)$/) ? currentMed.taperStart.match(/^([\d.,]+)\s*(.*)$/)[1] : '') : ''}
                      onChange={e => {
                        const match = currentMed.taperStart ? currentMed.taperStart.match(/^([\d.,]+)\s*(.*)$/) : null;
                        const unit = match ? match[2] : currentMed.taperStart || '';
                        setCurrentMed({ ...currentMed, taperStart: `${e.target.value} ${unit}`.trim() });
                      }}
                      placeholder="Amount"
                      className="w-1/3 px-3 py-2 rounded-lg border border-blue-300 focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-blue-50 text-[#111827] placeholder-blue-600 text-sm text-center"
                      dir="ltr"
                    />
                    <input suppressHydrationWarning
                      type="text"
                      list="taper-start-unit-options"
                      value={currentMed.taperStart ? (currentMed.taperStart.match(/^([\d.,]+)\s*(.*)$/) ? currentMed.taperStart.match(/^([\d.,]+)\s*(.*)$/)[2] : currentMed.taperStart) : ''}
                      onChange={e => {
                        const match = currentMed.taperStart ? currentMed.taperStart.match(/^([\d.,]+)\s*(.*)$/) : null;
                        const amount = match ? match[1] : '';
                        setCurrentMed({ ...currentMed, taperStart: `${amount} ${e.target.value}`.trim() });
                      }}
                      placeholder="Unit (e.g. times, drops...)"
                      className="w-2/3 px-3 py-2 rounded-lg border border-blue-300 focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-blue-50 text-[#111827] placeholder-blue-600 text-sm"
                    />
                  </div>
                  <datalist id="taper-start-unit-options">
                    <option value="times daily" />
                    <option value="drops daily" />
                  </datalist>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Taper Rate</label>
                  <div className="flex gap-3">
                    <div className="flex gap-2 flex-1">
                      <input suppressHydrationWarning
                        type="number"
                        step="any"
                        value={currentMed.taperRate ? (currentMed.taperRate.match(/^([\d.,]+)\s*(.*)$/) ? currentMed.taperRate.match(/^([\d.,]+)\s*(.*)$/)[1] : '') : ''}
                        onChange={e => {
                          const match = currentMed.taperRate ? currentMed.taperRate.match(/^([\d.,]+)\s*(.*)$/) : null;
                          const unit = match ? match[2] : currentMed.taperRate || '';
                          setCurrentMed({ ...currentMed, taperRate: `${e.target.value} ${unit}`.trim() });
                        }}
                        placeholder="Amount"
                        className="w-1/3 px-3 py-2 rounded-lg border border-blue-300 focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-blue-50 text-[#111827] placeholder-blue-600 text-sm text-center"
                        dir="ltr"
                      />
                      <input suppressHydrationWarning
                        type="text"
                        list="taper-rate-unit-options"
                        value={currentMed.taperRate ? (currentMed.taperRate.match(/^([\d.,]+)\s*(.*)$/) ? currentMed.taperRate.match(/^([\d.,]+)\s*(.*)$/)[2] : currentMed.taperRate) : ''}
                        onChange={e => {
                          const match = currentMed.taperRate ? currentMed.taperRate.match(/^([\d.,]+)\s*(.*)$/) : null;
                          const amount = match ? match[1] : '';
                          setCurrentMed({ ...currentMed, taperRate: `${amount} ${e.target.value}`.trim() });
                        }}
                        placeholder="Unit (e.g. days, weeks...)"
                        className="w-2/3 px-3 py-2 rounded-lg border border-blue-300 focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-blue-50 text-[#111827] placeholder-blue-600 text-sm"
                      />
                    </div>
                    <datalist id="taper-rate-unit-options">
                      <option value="days" />
                      <option value="weeks" />
                    </datalist>
                    <button suppressHydrationWarning
                      type="button"
                      onClick={handleAddMedication}
                      disabled={!currentMed.name}
                      className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors flex items-center gap-1 shrink-0"
                    >
                      {editingMedId ? <Edit2 size={16} /> : <Plus size={16} />} 
                      {editingMedId ? 'Update' : 'Add to Prescription'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Prescription List */}
        {selectedMedications.length > 0 && (
          <div className="mb-6 border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm text-start">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Medication</th>
                  <th className="px-4 py-3 font-semibold">Instructions</th>
                  <th className="px-4 py-3 text-end">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedMedications.map(med => (
                  <tr key={med.medication_id} className="bg-white">
                    <td className="px-4 py-3 font-medium text-slate-800">{med.name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {med.dosage} • {med.frequency} • {med.duration}
                    </td>
                    <td className="px-4 py-3 text-end flex justify-end gap-1">
                      <button suppressHydrationWarning
                        type="button"
                        onClick={() => handleEditMedication(med.medication_id)}
                        className="text-slate-400 hover:text-[#1434A4] p-1"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button suppressHydrationWarning
                        type="button"
                        onClick={() => handleRemoveMedication(med.medication_id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}


      </div>

      {/* Footer / Submit */}
      <div className="p-6 sm:p-8 bg-slate-50 flex justify-end gap-4">
        <button suppressHydrationWarning
          type="button"
          onClick={() => router.back()}
          disabled={isLoading}
          className="px-6 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button suppressHydrationWarning
          type="submit"
          disabled={isLoading}
          className="px-8 py-3 bg-[#1434A4] text-white font-bold rounded-xl hover:bg-[#102a83] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 min-w-[200px] shadow-sm"
        >
          {isLoading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
          {isEditing ? 'Save Changes' : 'Save Visit'}
        </button>
      </div>

    </form>
  )
}
