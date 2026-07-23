'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, User, Calendar, Phone, Plus, Loader2 } from 'lucide-react'
import { formatCairoDate } from '@/utils/timezone'
import { normalizeArabicText } from '@/utils/validation'
import { searchPatients } from '@/app/dashboard/search/actions'

export default function PatientAutocomplete({ 
  patients = [], 
  value = '', 
  onChange, // Passes back the patient_id
  onAddNew,
  placeholder = 'ابحث عن مريض بالاسم أو رقم الهاتف...' 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [localKnownPatients, setLocalKnownPatients] = useState(patients)
  const [searchResults, setSearchResults] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newAge, setNewAge] = useState('')
  const [newGender, setNewGender] = useState('Male')
  const [newAddress, setNewAddress] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const wrapperRef = useRef(null)

  // Find the selected patient to display their name if something is selected
  const selectedPatient = useMemo(() => {
    return localKnownPatients.find(p => p.id === value) || patients.find(p => p.id === value)
  }, [localKnownPatients, patients, value])

  // Update input text if a patient is already selected (e.g., initial load)
  useEffect(() => {
    if (selectedPatient) {
      setQuery(selectedPatient.full_name || '')
    } else {
      setQuery('')
    }
  }, [selectedPatient])

  // Debounced Search Effect
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (query.trim().length >= 1 && !selectedPatient) {
        setIsLoading(true)
        const results = await searchPatients(query.trim())
        setSearchResults(results)
        
        // Merge into known patients to ensure we can always find them if selected
        setLocalKnownPatients(prev => {
          const map = new Map(prev.map(p => [p.id, p]))
          results.forEach(p => map.set(p.id, p))
          return Array.from(map.values())
        })
        
        setIsLoading(false)
      } else if (!query.trim()) {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(handler)
  }, [query, selectedPatient])

  // exactMatch for the "Add New" button visibility
  const exactMatch = useMemo(() => {
    return searchResults.find(p => normalizeArabicText(p.full_name || '') === normalizeArabicText(query)) ||
           localKnownPatients.find(p => normalizeArabicText(p.full_name || '') === normalizeArabicText(query))
  }, [searchResults, localKnownPatients, query])

  const handleAddNewSubmit = async () => {
    if (!newName.trim() || isAdding) return
    setIsAdding(true)
    const newPatient = await onAddNew({ 
      full_name: newName.trim(), 
      phone: newPhone.trim() || null,
      age: newAge ? parseInt(newAge) : null,
      gender: newGender,
      address: newAddress.trim() || null,
      notes: newNotes.trim() || null
    })
    
    if (newPatient) {
      setLocalKnownPatients(prev => [...prev, newPatient])
      setQuery(newPatient.full_name) // immediately keep the name in the search box
    }

    setIsAdding(false)
    setIsOpen(false)
    setShowAddForm(false)
  }

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
        // Revert query to selected patient if they click away without selecting
        if (selectedPatient) {
          setQuery(selectedPatient.full_name)
        } else {
          setQuery('')
        }
        setShowAddForm(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selectedPatient])

  return (
    <div ref={wrapperRef} className="relative w-full print:hidden">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
            // If user starts typing, we clear the actual selected value until they pick one
            if (value) onChange('')
          }}
          onFocus={() => {
            setIsOpen(true)
            // if we focus and we have a selected patient, we can optionally clear it to search anew,
            // or just leave it so they can delete letters. We'll leave it.
          }}
          placeholder={placeholder}
          className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-white text-[#111827] placeholder-[#9CA3AF] text-sm"
          suppressHydrationWarning
        />
        <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
      </div>

      {isOpen && query.trim() && !selectedPatient && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-72 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" /> جاري البحث...
            </div>
          ) : searchResults.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {searchResults.map(patient => (
                <li 
                  key={patient.id}
                  onClick={() => {
                    onChange(patient.id)
                    setQuery(patient.full_name)
                    setIsOpen(false)
                  }}
                  className="p-3 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-800">{patient.full_name}</p>
                      <div className="flex gap-3 mt-1 text-xs text-slate-500">
                        {patient.age && (
                          <span className="flex items-center gap-1">
                            <User size={12} /> {patient.age} سنة
                          </span>
                        )}
                        {patient.phone && (
                          <span className="flex items-center gap-1" dir="ltr">
                            <Phone size={12} /> {patient.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    {patient.last_visit && (
                      <div className="text-xs text-slate-400 flex flex-col items-end">
                        <span className="flex items-center gap-1 mb-0.5">
                          <Calendar size={12} /> آخر زيارة:
                        </span>
                        <span>{formatCairoDate(patient.last_visit)}</span>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-slate-500 text-sm border-b border-slate-100 bg-slate-50">
              لا توجد نتائج مطابقة
            </div>
          )}

          {!exactMatch && !isLoading && onAddNew && (
            <div className="p-3 border-t border-slate-100 bg-slate-50 rounded-b-xl shrink-0">
              {showAddForm ? (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto p-1 custom-scrollbar">
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="اسم المريض *"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#1434A4]"
                    suppressHydrationWarning
                  />
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    placeholder="رقم الهاتف (اختياري)"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#1434A4]"
                    dir="ltr"
                    suppressHydrationWarning
                  />
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={newAge}
                      onChange={e => setNewAge(e.target.value)}
                      placeholder="العمر"
                      className="w-1/2 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#1434A4]"
                    />
                    <select
                      value={newGender}
                      onChange={e => setNewGender(e.target.value)}
                      className="w-1/2 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#1434A4]"
                    >
                      <option value="Male">ذكر</option>
                      <option value="Female">أنثى</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    value={newAddress}
                    onChange={e => setNewAddress(e.target.value)}
                    placeholder="العنوان (اختياري)"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#1434A4]"
                  />
                  <textarea
                    value={newNotes}
                    onChange={e => setNewNotes(e.target.value)}
                    placeholder="ملاحظات طبية سريعة (اختياري)"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#1434A4] resize-none h-20 custom-scrollbar"
                  />
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={handleAddNewSubmit}
                      disabled={isAdding || !newName.trim()}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#1434A4] text-white rounded-lg text-xs font-semibold hover:bg-[#102a83] disabled:opacity-50 transition-colors shadow-sm"
                    >
                      {isAdding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      حفظ المريض
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const isPhone = /^[0-9+\s]+$/.test(query.trim())
                    setNewName(isPhone ? '' : query.trim())
                    setNewPhone(isPhone ? query.trim() : '')
                    setNewAge('')
                    setNewGender('Male')
                    setNewAddress('')
                    setNewNotes('')
                    setShowAddForm(true)
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-50 text-[#1434A4] rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors"
                >
                  <Plus size={16} />
                  إضافة "{query.trim()}" كمريض جديد
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
