// 'use client'

// import { useState, useEffect } from 'react'
// import { Printer, X, Plus } from 'lucide-react'
// import { formatCairoDate } from '@/utils/timezone'
// import Autocomplete from '@/components/ui/Autocomplete'
// import PatientAutocomplete from '@/components/ui/PatientAutocomplete'
// import { createMedicationInlineAction } from '@/app/dashboard/medications/actions'
// import { createDiseaseInlineAction } from '@/app/dashboard/diseases/actions'
// import { getAllEyeMeasurementsAction } from '@/app/dashboard/patients/actions'

// export default function RxGeneratorClient({ patients, diseases: initialDiseases, medications: initialMedications }) {
//   const [diseases, setDiseases] = useState(initialDiseases)
//   const [medications, setMedications] = useState(initialMedications)
//   const [isPrinting, setIsPrinting] = useState(false)

//   // Form State
//   const [patientId, setPatientId] = useState('')
//   const [customPatientName, setCustomPatientName] = useState('')
//   const [customPatientAge, setCustomPatientAge] = useState('')
  
//   const [diagnosis, setDiagnosis] = useState('')
//   const [selectedMedications, setSelectedMedications] = useState([])
//   const [currentMed, setCurrentMed] = useState({ name: '', dosage: '', duration: '', notes: '' })
  
//   const [doctorNotes, setDoctorNotes] = useState('')
//   const doctorName = "Dr. Sabry" // Replace with auth user if needed

//   // Eye Measurements State
//   const [rightEye, setRightEye] = useState({ sph: '', cyl: '', axis: '' })
//   const [leftEye, setLeftEye] = useState({ sph: '', cyl: '', axis: '' })
//   const [historicalMeasurements, setHistoricalMeasurements] = useState([])
//   const [selectedMeasurementId, setSelectedMeasurementId] = useState('')
//   const [isLoadingMeasurements, setIsLoadingMeasurements] = useState(false)

//   const fetchEyeMeasurements = async (pid) => {
//     if (!pid) {
//       setHistoricalMeasurements([])
//       setSelectedMeasurementId('')
//       setRightEye({ sph: '', cyl: '', axis: '' })
//       setLeftEye({ sph: '', cyl: '', axis: '' })
//       return
//     }
    
//     setIsLoadingMeasurements(true)
//     const res = await getAllEyeMeasurementsAction(pid)
//     if (res?.data && res.data.length > 0) {
//       setHistoricalMeasurements(res.data)
//       // Auto select the latest
//       const latest = res.data[0]
//       setSelectedMeasurementId(latest.id)
//       setRightEye({ sph: latest.right_sph, cyl: latest.right_cyl, axis: latest.right_axis })
//       setLeftEye({ sph: latest.left_sph, cyl: latest.left_cyl, axis: latest.left_axis })
//     } else {
//       setHistoricalMeasurements([])
//       setSelectedMeasurementId('')
//       setRightEye({ sph: '', cyl: '', axis: '' })
//       setLeftEye({ sph: '', cyl: '', axis: '' })
//     }
//     setIsLoadingMeasurements(false)
//   }

//   const handleSelectMeasurement = (e) => {
//     const id = e.target.value
//     setSelectedMeasurementId(id)
//     if (!id) {
//       setRightEye({ sph: '', cyl: '', axis: '' })
//       setLeftEye({ sph: '', cyl: '', axis: '' })
//       return
//     }
//     const m = historicalMeasurements.find(x => x.id === id)
//     if (m) {
//       setRightEye({ sph: m.right_sph, cyl: m.right_cyl, axis: m.right_axis })
//       setLeftEye({ sph: m.left_sph, cyl: m.left_cyl, axis: m.left_axis })
//     }
//   }

//   useEffect(() => {
//     fetchEyeMeasurements(patientId)
//   }, [patientId])

//   useEffect(() => {
//     if (isPrinting) {
//       // Trigger print dialog shortly after switching to print view
//       const timer = setTimeout(() => {
//         window.print()
//       }, 500)
      
//       // When print dialog closes, return to form view
//       // Note: listening to afterprint is the standard way to detect when printing is done or cancelled
//       const handleAfterPrint = () => setIsPrinting(false)
//       window.addEventListener('afterprint', handleAfterPrint)
      
//       return () => {
//         clearTimeout(timer)
//         window.removeEventListener('afterprint', handleAfterPrint)
//       }
//     }
//   }, [isPrinting])

//   const handleAddNewDisease = async (name) => {
//     const res = await createDiseaseInlineAction(name)
//     if (res.success && res.data) {
//       setDiseases([...diseases, res.data])
//       setDiagnosis(res.data.name)
//     }
//   }

//   const handleAddNewMedication = async (name) => {
//     const res = await createMedicationInlineAction(name)
//     if (res.success && res.data) {
//       setMedications([...medications, res.data])
//       setCurrentMed({ ...currentMed, name: res.data.name })
//     }
//   }

//   const handleAddMedication = () => {
//     if (!currentMed.name) return
//     setSelectedMedications([...selectedMedications, { ...currentMed }])
//     setCurrentMed({ name: '', dosage: '', duration: '', notes: '' })
//   }

//   const handleRemoveMedication = (index) => {
//     const newMeds = [...selectedMedications]
//     newMeds.splice(index, 1)
//     setSelectedMedications(newMeds)
//   }

//   // Derived patient info for printing
//   const activePatient = patientId 
//     ? patients.find(p => p.id === patientId) 
//     : { full_name: customPatientName, age: customPatientAge }

//   if (isPrinting) {
//     return (
//       <div className="fixed inset-0 bg-white z-[100] flex justify-center w-full min-h-screen">
        
//         {/* CSS specifically for the print dialog */}
//         <style dangerouslySetInnerHTML={{__html: `
//           @media print {
//             @page { size: A5; margin: 0; }
//             body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
//           }
//         `}} />

//         {/* A5 Sized Container - 148 x 210 mm -> ~ 559 x 794 px */}
//         <div className="w-[148mm] h-[210mm] bg-white text-slate-900 p-8 flex flex-col mx-auto relative shadow-2xl print:shadow-none print:m-0 border border-slate-200 print:border-none">
          
//           {/* Header */}
//           <div className="border-b-2 border-[#1434A4] pb-4 mb-6 flex justify-between items-end">
//             <div>
//               <h1 className="text-2xl font-bold text-[#1434A4]">دكتور صبري عياد</h1>
//               <p className="text-sm font-semibold mt-1">{doctorName}</p>
//               <p className="text-xs text-slate-500">Consultant Ophthalmologist</p>
//             </div>
//             <div className="text-end">
//               <p className="text-xs text-slate-500">123 Medical Center Ave.</p>
//               <p className="text-xs text-slate-500">Phone: +1 (555) 019-8234</p>
//             </div>
//           </div>

//           {/* Patient Details */}
//           <div className="flex justify-between items-center bg-slate-50 p-3 rounded mb-6 text-sm">
//             <div>
//               <span className="text-slate-500">الاسم: </span>
//               <span className="font-bold">{activePatient?.full_name || '______________________'}</span>
//             </div>
//             <div>
//               <span className="text-slate-500">العمر: </span>
//               <span className="font-bold">{activePatient?.age || '____'} سنة</span>
//             </div>
//             <div>
//               <span className="text-slate-500">التاريخ: </span>
//               <span className="font-bold">{formatCairoDate(new Date())}</span>
//             </div>
//           </div>

//           {/* Diagnosis */}
//           {diagnosis && (
//             <div className="mb-6">
//               <span className="text-sm font-bold text-[#1434A4]">عنوان الزيارة: </span>
//               <span className="text-sm">{diagnosis}</span>
//             </div>
//           )}

//           {/* Eye Measurements (Print) */}
//           {(rightEye.sph || rightEye.cyl || leftEye.sph || leftEye.cyl) && (
//             <div className="mb-6 w-3/4">
//               <span className="text-sm font-bold text-[#1434A4] mb-2 block">قياسات النظر:</span>
//               <table className="w-full text-center text-sm border-collapse border border-slate-300">
//                 <thead>
//                   <tr className="bg-slate-50">
//                     <th className="border border-slate-300 py-1 text-xs w-1/4">Eye</th>
//                     <th className="border border-slate-300 py-1 text-xs w-1/4">SPH</th>
//                     <th className="border border-slate-300 py-1 text-xs w-1/4">CYL</th>
//                     <th className="border border-slate-300 py-1 text-xs w-1/4">AXIS</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {(rightEye.sph || rightEye.cyl || rightEye.axis) && (
//                     <tr>
//                       <td className="border border-slate-300 py-1 font-bold text-xs">Right (OD)</td>
//                       <td className="border border-slate-300 py-1" dir="ltr">{rightEye.sph}</td>
//                       <td className="border border-slate-300 py-1" dir="ltr">{rightEye.cyl}</td>
//                       <td className="border border-slate-300 py-1" dir="ltr">{rightEye.axis}</td>
//                     </tr>
//                   )}
//                   {(leftEye.sph || leftEye.cyl || leftEye.axis) && (
//                     <tr>
//                       <td className="border border-slate-300 py-1 font-bold text-xs">Left (OS)</td>
//                       <td className="border border-slate-300 py-1" dir="ltr">{leftEye.sph}</td>
//                       <td className="border border-slate-300 py-1" dir="ltr">{leftEye.cyl}</td>
//                       <td className="border border-slate-300 py-1" dir="ltr">{leftEye.axis}</td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           )}

//           {/* Rx Symbol */}
//           <div className="text-4xl font-serif font-bold text-slate-300 mb-4 select-none">
//             Rx
//           </div>

//           {/* Medications */}
//           <div className="flex-1">
//             <ul className="space-y-6">
//               {selectedMedications.map((med, idx) => (
//                 <li key={idx} className="border-b border-slate-100 pb-4">
//                   <div className="flex items-center gap-2">
//                     <span className="font-bold text-slate-800 text-lg">{med.name}</span>
//                     {med.dosage && <span className="text-sm text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{med.dosage}</span>}
//                     {med.duration && <span className="text-xs text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full">{med.duration}</span>}
//                   </div>
//                   {med.notes && (
//                     <p className="text-sm text-slate-600 mt-1 ps-4 italic border-s-2 border-[#1434A4] ms-1">Sig: {med.notes}</p>
//                   )}
//                   {med.instructions && !med.notes && (
//                     <p className="text-sm text-slate-600 mt-1 ps-4 italic border-s-2 border-[#1434A4] ms-1">Sig: {med.instructions}</p>
//                   )}
//                 </li>
//               ))}
//             </ul>
            
//             {selectedMedications.length === 0 && (
//               <p className="text-slate-400 italic text-sm">لم يتم وصف أي أدوية.</p>
//             )}
//           </div>

//           {/* Doctor Notes */}
//           {doctorNotes && (
//             <div className="mt-8 pt-4 border-t border-slate-100 text-sm text-slate-700 italic">
//               "{doctorNotes}"
//             </div>
//           )}

//           {/* Footer / Signature */}
//           <div className="mt-12 flex justify-between items-end">
//             <div className="text-xs text-slate-400">
//               صالحة لمدة 30 يوماً من تاريخ الإصدار.
//             </div>
//             <div className="text-center">
//               <div className="w-40 border-b border-slate-400 mb-2"></div>
//               <p className="text-xs font-semibold text-slate-600">توقيع الطبيب</p>
//             </div>
//           </div>
          
//         </div>
        
//         {/* Helper overlay for screen (hidden in print) */}
//         <div className="fixed top-4 right-4 print:hidden">
//           <button 
//             onClick={() => setIsPrinting(false)}
//             className="bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2 hover:bg-slate-800"
//           >
//             <X size={16} /> إلغاء الطباعة
//           </button>
//         </div>
//       </div>
//     )
//   }

//   // FORM VIEW
//   return (
//     <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
      
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
//         {/* Left Column - Patient & Details */}
//         <div className="space-y-6">
//           <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">1. بيانات المريض</h3>
          
//           <div>
//             <label className="block text-sm font-medium text-slate-700 mb-2">اختر مريض مسجل</label>
//             <PatientAutocomplete 
//               patients={patients}
//               value={patientId}
//               onChange={setPatientId}
//             />
//           </div>

//           {!patientId && (
//             <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
//               <div className="col-span-2">
//                 <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">اسم المريض (مخصص)</label>
//                 <input
//                   type="text"
//                   value={customPatientName}
//                   onChange={e => setCustomPatientName(e.target.value)}
//                   className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-white text-[#111827] placeholder-[#9CA3AF] text-sm"
//                   suppressHydrationWarning
//                 />
//               </div>
//               <div>
//                 <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">العمر</label>
//                 <input
//                   type="text"
//                   value={customPatientAge}
//                   onChange={e => setCustomPatientAge(e.target.value)}
//                   className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-white text-[#111827] placeholder-[#9CA3AF] text-sm"
//                   suppressHydrationWarning
//                 />
//               </div>
//             </div>
//           )}

//           <div>
//             <label className="block text-sm font-medium text-slate-700 mb-2">عنوان الزيارة (اختياري)</label>
//             <div className="print:hidden">
//               <Autocomplete 
//                 items={diseases}
//                 value={diagnosis}
//                 onChange={setDiagnosis}
//                 onAddNew={handleAddNewDisease}
//                 placeholder="بحث عن تشخيص..."
//                 itemName="تشخيص"
//               />
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-slate-700 mb-2">ملاحظات الطبيب (اختياري)</label>
//             <textarea
//               value={doctorNotes}
//               onChange={e => setDoctorNotes(e.target.value)}
//               rows={3}
//               placeholder="ستتم طباعتها في أسفل الروشتة..."
//               className="w-full px-4 py-2.5 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-white text-[#111827] placeholder-[#9CA3AF] text-sm resize-none"
//               suppressHydrationWarning
//             />
//           </div>
//         </div>

//         {/* Right Column - Medications */}
//         <div className="space-y-6">
//           <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">2. وصف الأدوية</h3>
          
//           <div className="bg-[#1434A4]/5 p-4 rounded-xl border border-[#1434A4]/10 space-y-4">
//             <div>
//               <label className="block text-xs font-bold text-slate-700 uppercase mb-1">اسم الدواء</label>
//               <Autocomplete 
//                 items={medications}
//                 value={currentMed.name}
//                 onChange={val => setCurrentMed({ ...currentMed, name: val })}
//                 onAddNew={handleAddNewMedication}
//                 placeholder="بحث عن دواء..."
//                 itemName="دواء"
//               />
//             </div>
            
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//               <div>
//                 <label className="block text-xs font-bold text-slate-700 uppercase mb-1">الجرعة</label>
//                 <input
//                   type="text"
//                   value={currentMed.dosage}
//                   onChange={e => setCurrentMed({ ...currentMed, dosage: e.target.value })}
//                   placeholder="مثلاً: قطرة واحدة"
//                   className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-white text-[#111827] placeholder-[#9CA3AF] text-sm"
//                   suppressHydrationWarning
//                 />
//               </div>
//               <div>
//                 <label className="block text-xs font-bold text-slate-700 uppercase mb-1">المدة</label>
//                 <input
//                   type="text"
//                   value={currentMed.duration}
//                   onChange={e => setCurrentMed({ ...currentMed, duration: e.target.value })}
//                   placeholder="مثلاً: 7 أيام"
//                   className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-white text-[#111827] placeholder-[#9CA3AF] text-sm"
//                   suppressHydrationWarning
//                 />
//               </div>
//               <div>
//                 <label className="block text-xs font-bold text-slate-700 uppercase mb-1">ملاحظات للدواء</label>
//                 <input
//                   type="text"
//                   value={currentMed.notes}
//                   onChange={e => setCurrentMed({ ...currentMed, notes: e.target.value })}
//                   placeholder="مثلاً: يستخدم بعد الأكل"
//                   className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-white text-[#111827] placeholder-[#9CA3AF] text-sm"
//                   suppressHydrationWarning
//                 />
//               </div>
//             </div>
            
//             <button
//               type="button"
//               onClick={handleAddMedication}
//               disabled={!currentMed.name}
//               className="w-full py-2 bg-white border border-[#1434A4] text-[#1434A4] rounded-lg text-sm font-bold hover:bg-blue-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
//             >
//               <Plus size={16} /> إضافة للروشتة
//             </button>
//           </div>

//           <div className="min-h-[150px] border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50">
//             {selectedMedications.length === 0 ? (
//               <div className="h-full flex items-center justify-center text-slate-400 text-sm">
//                 لم يتم إضافة أي أدوية حتى الآن.
//               </div>
//             ) : (
//               <ul className="space-y-3">
//                 {selectedMedications.map((med, idx) => (
//                   <li key={idx} className="flex items-start justify-between bg-white p-3 rounded border border-slate-100 shadow-sm">
//                     <div>
//                       <div className="font-semibold text-slate-800 text-sm">{med.name}</div>
//                       <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 flex-wrap">
//                         {med.dosage && <span>{med.dosage} • </span>}
//                         {med.duration && <span>{med.duration} • </span>}
//                         {med.notes && <span className="italic">{med.notes}</span>}
//                         {med.instructions && !med.notes && <span className="italic">{med.instructions}</span>}
//                       </div>
//                     </div>
//                     <button
//                       type="button"
//                       onClick={() => handleRemoveMedication(idx)}
//                       className="text-slate-400 hover:text-red-500 p-1 transition-colors"
//                     >
//                       <X size={16} />
//                     </button>
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </div>
          
//           {/* Eye Measurements Form */}
//           <div className="mt-8">
//             <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 flex justify-between items-center">
//               <span>3. قياسات النظر (اختياري)</span>
//               <button 
//                 type="button" 
//                 onClick={() => fetchEyeMeasurements(patientId)}
//                 disabled={!patientId || isLoadingMeasurements}
//                 className="text-xs text-[#1434A4] hover:underline flex items-center gap-1 font-normal disabled:opacity-50 disabled:no-underline"
//               >
//                 {isLoadingMeasurements ? 'جاري التحميل...' : 'استرجاع القياسات السابقة'}
//               </button>
//             </h3>
            
//             <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mt-4">
//               {historicalMeasurements.length > 0 && (
//                 <div className="mb-4">
//                   <label className="block text-xs font-semibold text-slate-500 mb-2">اختر قياس سابق</label>
//                   <select 
//                     value={selectedMeasurementId} 
//                     onChange={handleSelectMeasurement}
//                     className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] outline-none text-sm bg-white"
//                   >
//                     <option value="">-- تفريغ الحقول / قياس جديد --</option>
//                     {historicalMeasurements.map((m, idx) => (
//                       <option key={m.id} value={m.id}>
//                         {idx === 0 ? 'أحدث قياس: ' : ''}{new Date(m.created_at).toLocaleDateString('ar-EG')}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               )}
              
//               <div className="space-y-6">
//                 {/* Right Eye */}
//                 <div>
//                   <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
//                     <div className="w-2 h-2 rounded-full bg-blue-500"></div> العين اليمنى (OD)
//                   </h4>
//                   <div className="grid grid-cols-3 gap-3">
//                     <div>
//                       <label className="block text-xs font-semibold text-slate-500 mb-1 text-center">SPH</label>
//                       <input type="text" value={rightEye.sph || ''} onChange={e => setRightEye({...rightEye, sph: e.target.value})} className="w-full px-3 py-2 text-center rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] outline-none text-sm bg-white" dir="ltr" placeholder="+0.00" suppressHydrationWarning />
//                     </div>
//                     <div>
//                       <label className="block text-xs font-semibold text-slate-500 mb-1 text-center">CYL</label>
//                       <input type="text" value={rightEye.cyl || ''} onChange={e => setRightEye({...rightEye, cyl: e.target.value})} className="w-full px-3 py-2 text-center rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] outline-none text-sm bg-white" dir="ltr" placeholder="-0.00" suppressHydrationWarning />
//                     </div>
//                     <div>
//                       <label className="block text-xs font-semibold text-slate-500 mb-1 text-center">AXIS</label>
//                       <input type="text" value={rightEye.axis || ''} onChange={e => setRightEye({...rightEye, axis: e.target.value})} className="w-full px-3 py-2 text-center rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] outline-none text-sm bg-white" dir="ltr" placeholder="180" suppressHydrationWarning />
//                     </div>
//                   </div>
//                 </div>
                
//                 <div className="border-t border-slate-200"></div>

//                 {/* Left Eye */}
//                 <div>
//                   <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
//                     <div className="w-2 h-2 rounded-full bg-emerald-500"></div> العين اليسرى (OS)
//                   </h4>
//                   <div className="grid grid-cols-3 gap-3">
//                     <div>
//                       <label className="block text-xs font-semibold text-slate-500 mb-1 text-center">SPH</label>
//                       <input type="text" value={leftEye.sph || ''} onChange={e => setLeftEye({...leftEye, sph: e.target.value})} className="w-full px-3 py-2 text-center rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] outline-none text-sm bg-white" dir="ltr" placeholder="+0.00" suppressHydrationWarning />
//                     </div>
//                     <div>
//                       <label className="block text-xs font-semibold text-slate-500 mb-1 text-center">CYL</label>
//                       <input type="text" value={leftEye.cyl || ''} onChange={e => setLeftEye({...leftEye, cyl: e.target.value})} className="w-full px-3 py-2 text-center rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] outline-none text-sm bg-white" dir="ltr" placeholder="-0.00" suppressHydrationWarning />
//                     </div>
//                     <div>
//                       <label className="block text-xs font-semibold text-slate-500 mb-1 text-center">AXIS</label>
//                       <input type="text" value={leftEye.axis || ''} onChange={e => setLeftEye({...leftEye, axis: e.target.value})} className="w-full px-3 py-2 text-center rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] outline-none text-sm bg-white" dir="ltr" placeholder="180" suppressHydrationWarning />
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
          
//         </div>

//       </div>

//       <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
//         <button
//           onClick={() => setIsPrinting(true)}
//           disabled={!activePatient?.full_name && !selectedMedications.length}
//           className="px-8 py-3 bg-[#1434A4] text-white rounded-xl font-bold hover:bg-[#102a83] disabled:opacity-50 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
//         >
//           <Printer size={18} /> إنشاء وطباعة
//         </button>
//       </div>

//     </div>
//   )
// }
