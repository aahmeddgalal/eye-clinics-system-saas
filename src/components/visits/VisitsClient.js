'use client'

import { useState, useMemo, useEffect, Fragment } from 'react'
import Link from 'next/link'
import { CalendarCheck, ChevronDown, ChevronUp, Clock, Pill, FileText, Printer, Eye, Edit2, Search, Plus, Loader2, ChevronRight, ChevronLeft } from 'lucide-react'
import { formatInTimeZone } from 'date-fns-tz'
import { TIMEZONE, formatCairoTime } from '@/utils/timezone'
import VisitDetailsModal from './VisitDetailsModal'
import { createQuickVisitAction } from '@/app/dashboard/visits/actions'
import { useRouter, useSearchParams } from 'next/navigation'
import { normalizeArabicText } from '@/utils/validation'

export default function VisitsClient({ initialVisits, patientsCatalog = [], currentMonth }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [visits, setVisits] = useState(initialVisits)
  const [selectedVisit, setSelectedVisit] = useState(null)

  useEffect(() => {
    setVisits(initialVisits)
  }, [initialVisits])
  
  const handleMonthChange = (offset) => {
    const params = new URLSearchParams(searchParams.toString())
    // currentMonth is in YYYY-MM format
    const [year, month] = currentMonth.split('-').map(Number)
    let newDate = new Date(year, month - 1 + offset, 1)
    
    // Add timezone adjustment safety to prevent offset bugs
    const newYear = newDate.getFullYear()
    const newMonthStr = String(newDate.getMonth() + 1).padStart(2, '0')
    params.set('month', `${newYear}-${newMonthStr}`)
    router.push(`/dashboard/visits?${params.toString()}`)
  }

  // Smart Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  // We need to group visits by date and compute aggregates
  const groupedVisits = useMemo(() => {
    const groups = {}

    visits.forEach(visit => {
      // Grouping based on the Egypt date string
      const dateStr = formatInTimeZone(new Date(visit.visit_date), TIMEZONE, 'yyyy-MM-dd')
      if (!groups[dateStr]) {
        groups[dateStr] = {
          date: dateStr,
          visits: [],
          totalPrescriptions: 0,
          totalMedications: 0
        }
      }

      const g = groups[dateStr]
      g.visits.push(visit)

      const rxCount = visit.prescriptions?.length || 0
      g.totalPrescriptions += rxCount

      if (rxCount > 0) {
        visit.prescriptions.forEach(rx => {
          g.totalMedications += rx.medications_data?.length || 0
        })
      }
    })

    // Sort dates descending
    return Object.keys(groups)
      .sort((a, b) => new Date(b) - new Date(a))
      .map(dateStr => ({
        date: dateStr,
        visits: groups[dateStr].visits,
        totalVisits: groups[dateStr].visits.length,
        totalPrescriptions: groups[dateStr].totalPrescriptions,
        totalMedications: groups[dateStr].totalMedications
      }))
  }, [visits])

  // Filter patients by name or phone for dropdown
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const normalizedQ = normalizeArabicText(searchQuery)
    return patientsCatalog.filter(p =>
      normalizeArabicText(p.full_name || '').includes(normalizedQ) ||
      p.phone?.includes(normalizedQ)
    )
  }, [searchQuery, patientsCatalog])

  // Filter today's list and timeline based on search query
  const filteredGroupedVisits = useMemo(() => {
    let result = groupedVisits

    if (searchQuery.trim()) {
      const normalizedQ = normalizeArabicText(searchQuery)
      result = result.map(group => {
        const filteredVisits = group.visits.filter(v =>
          normalizeArabicText(v.patients?.full_name || '').includes(normalizedQ) ||
          v.patients?.phone?.includes(normalizedQ)
        )
        return {
          ...group,
          visits: filteredVisits
        }
      }).filter(group => group.visits.length > 0)
    }

    return result
  }, [searchQuery, groupedVisits])

  const handleQueuePatient = async (patientId) => {
    setIsSearching(true)
    const res = await createQuickVisitAction(patientId)
    if (res.success && res.visit) {
      setVisits(prev => [res.visit, ...prev])
      setSearchQuery('')
      setShowDropdown(false)
    } else {
      alert(res.error || 'An unexpected error occurred.')
    }
    setIsSearching(false)
  }

  const handleCreateAndQueue = async () => {
    setIsSearching(true)
    const isPhone = /^[0-9+\s]+$/.test(searchQuery.trim())
    const newPatientData = isPhone
      ? { phone: searchQuery.trim(), name: 'New Patient' }
      : { name: searchQuery.trim() }

    const res = await createQuickVisitAction(null, newPatientData)
    if (res.success && res.visit) {
      setVisits(prev => [res.visit, ...prev])
      if (res.newPatient) {
        // Optimistically add to catalog so they are searchable immediately
        patientsCatalog.push(res.newPatient)
      }
      setSearchQuery('')
      setShowDropdown(false)
    } else {
      alert(res.error || 'An unexpected error occurred.')
    }
    setIsSearching(false)
  }

  // Get "Today" date string in Egypt time
  const todayStr = formatInTimeZone(new Date(), TIMEZONE, 'yyyy-MM-dd')
  const todayVisits = groupedVisits.find(g => g.date === todayStr)?.visits || []

  // Calculate "Yesterday" date string in Egypt time
  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterdayStr = formatInTimeZone(yesterdayDate, TIMEZONE, 'yyyy-MM-dd')

  // Set initial expanded sections
  const [expandedDates, setExpandedDates] = useState(() => {
    const initial = {}
    groupedVisits.forEach(group => {
      // "Today" is expanded by default
      initial[group.date] = group.date === todayStr
    })
    return initial
  })

  // Removed searchDate expansion effect

  const toggleSection = (dateStr) => {
    setExpandedDates(prev => ({
      ...prev,
      [dateStr]: !prev[dateStr]
    }))
  }

  const getDateLabel = (dateStr) => {
    if (dateStr === todayStr) return 'Today'
    if (dateStr === yesterdayStr) return 'Yesterday'
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <div className="space-y-6 print:m-0 print:p-0 print:space-y-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-[#1434A4]">
            <CalendarCheck size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Daily Reports & Visits</h1>
            <p className="text-slate-500 text-sm mt-1">View visit summaries and clinic statistics for the selected month</p>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
          <button 
            onClick={() => handleMonthChange(-1)}
            className="p-2 hover:bg-slate-50 text-slate-600 hover:text-[#1434A4] rounded-lg transition-colors"
            title="Previous Month"
          >
            <ChevronRight size={20} />
          </button>
          
          <div className="font-bold text-slate-800 text-center flex items-center justify-center">
            <input 
              type="month" 
              value={currentMonth}
              onChange={(e) => {
                if (e.target.value) {
                  const params = new URLSearchParams(searchParams.toString())
                  params.set('month', e.target.value)
                  router.push(`/dashboard/visits?${params.toString()}`)
                }
              }}
              className="px-4 py-2 text-base rounded-lg border-2 border-slate-100 hover:border-slate-200 focus:border-[#1434A4] focus:ring-0 outline-none bg-slate-50 text-slate-800 transition-colors cursor-pointer"
              title="Select Month"
              suppressHydrationWarning
            />
          </div>

          <button 
            onClick={() => handleMonthChange(1)}
            className="p-2 hover:bg-slate-50 text-slate-600 hover:text-[#1434A4] rounded-lg transition-colors"
            title="Next Month"
          >
            <ChevronLeft size={20} />
          </button>
        </div>
      </div>

      {/* Smart Search & Queue Entry */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-8 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Search size={20} className="text-[#1434A4]" />
            Search in Records
          </h2>
        </div>
        <div className="relative max-w-2xl z-50">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search patient by name or phone..."
            className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 focus:border-[#1434A4] focus:ring-1 focus:ring-[#1434A4] outline-none text-slate-700 bg-slate-50 transition-colors"
            suppressHydrationWarning
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />

          {showDropdown && searchQuery.trim() && (
            <div className="absolute w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-80 flex flex-col overflow-hidden">
              <div className="overflow-y-auto flex-1 p-2">
                {searchResults.length > 0 ? (
                  <ul className="space-y-1">
                    {searchResults.map(patient => {
                      const patientTodayVisit = todayVisits.find(v => v.patient_id === patient.id)
                      return (
                        <li key={patient.id} className="p-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                          <div>
                            <p className="font-bold text-slate-800">{patient.full_name}</p>
                            {patient.phone && <p className="text-xs text-slate-500 mt-0.5" dir="ltr">{patient.phone}</p>}
                          </div>
                          <div className="flex gap-2">
                            {patientTodayVisit ? (
                              <button
                                onClick={() => { setSelectedVisit(patientTodayVisit); setShowDropdown(false); }}
                                className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 flex-1 sm:flex-none text-center transition-colors"
                                suppressHydrationWarning
                              >
                                View Today's Visit
                              </button>
                            ) : (
                              <Link
                                href={`/dashboard/patients/${patient.id}`}
                                className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 flex-1 sm:flex-none text-center transition-colors"
                              >
                                Medical Profile
                              </Link>
                            )}

                            <button
                              onClick={() => handleQueuePatient(patient.id)}
                              disabled={isSearching || patientTodayVisit}
                              className="text-xs font-bold text-[#1434A4] bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none text-center transition-colors"
                              suppressHydrationWarning
                            >
                              Create Visit
                            </button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-slate-500 text-sm">No patient found with this name or number.</div>
                )}
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={handleCreateAndQueue}
                  disabled={isSearching}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1434A4] text-white rounded-lg font-bold hover:bg-[#102a83] transition-colors disabled:opacity-50 shadow-md"
                  suppressHydrationWarning
                >
                  {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  Add New Patient and Visit: "{searchQuery.trim()}"
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {filteredGroupedVisits.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center print:hidden">
          <CalendarCheck size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">No Matching Reports</h3>
          <p className="text-slate-500 text-sm">No visits found matching the search criteria.</p>
        </div>
      ) : (
        <div className="space-y-4 print:space-y-0">
          {filteredGroupedVisits.map((group) => {
            const isExpanded = expandedDates[group.date]

            return (
              <div
                key={group.date}
                className={`bg-white rounded-xl border border-slate-100 overflow-hidden transition-all duration-200 ${isExpanded ? 'shadow-md print:shadow-none print:border-none print:mb-8' : 'shadow-sm print:hidden'}`}
              >
                <button
                  onClick={() => toggleSection(group.date)}
                  className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors focus:outline-none print:hidden"
                  suppressHydrationWarning
                >
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-[#1434A4]">
                      {getDateLabel(group.date)}
                    </h2>
                  </div>
                  <div className="text-slate-400">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-5 pt-0 border-t border-slate-50 print:border-none print:p-0 print:block">

                    {/* Header for Print Only */}
                    <div className="hidden print:block mb-6 text-center border-b pb-4">
                      <h2 className="text-2xl font-bold text-slate-900">Daily Report</h2>
                      <p className="text-lg text-slate-600 mt-1">{new Date(group.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>

                    {/* Summary Cards - Adjusted Grid Here */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-5 mb-6 print:hidden">
                      <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center gap-4 print:bg-white print:border-slate-200">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg print:hidden">
                          <CalendarCheck size={20} />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-semibold mb-1">Total Visits</p>
                          <p className="text-xl font-bold text-slate-900">{group.totalVisits}</p>
                        </div>
                      </div>

                      <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 flex items-center gap-4 print:bg-white print:border-slate-200">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg print:hidden">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-semibold mb-1">Total Prescriptions</p>
                          <p className="text-xl font-bold text-slate-900">{group.totalPrescriptions}</p>
                        </div>
                      </div>

                      <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 flex items-center gap-4 print:bg-white print:border-slate-200">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg print:hidden">
                          <Pill size={20} />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-semibold mb-1">Prescribed Meds</p>
                          <p className="text-xl font-bold text-slate-900">{group.totalMedications}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mb-4 print:hidden">
                      <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-semibold"
                        suppressHydrationWarning
                      >
                        <Printer size={16} />
                        Print Report
                      </button>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-lg print:hidden">
                      <table className="w-full text-sm text-start text-slate-600">
                        <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200 print:bg-slate-100 print:text-black">
                          <tr>
                            <th scope="col" className="px-4 py-3 font-semibold w-1/4">Patient Name</th>
                            <th scope="col" className="px-4 py-3 font-semibold">Visit Time</th>
                            <th scope="col" className="px-4 py-3 font-semibold w-1/3">Visit Title</th>
                            <th scope="col" className="px-4 py-3 font-semibold text-center">Prescriptions</th>
                            <th scope="col" className="px-4 py-3 font-semibold text-center print:hidden">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.visits.map(visit => (
                            <tr
                              key={visit.id}
                              onClick={() => setSelectedVisit(visit)}
                              className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer"
                            >
                              <td className="px-4 py-3 font-bold text-slate-900">
                                <Link
                                  href={`/dashboard/patients/${visit.patient_id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="hover:text-[#1434A4] hover:underline print:no-underline print:text-black"
                                >
                                  {visit.patients?.full_name || 'Unknown Patient'}
                                </Link>
                              </td>
                              <td className="px-4 py-3 text-slate-500 print:text-black" dir="ltr">
                                {formatCairoTime(visit.visit_date)}
                              </td>
                              <td className="px-4 py-3 text-slate-700 print:text-black">
                                {visit.diagnosis || '-'}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${visit.prescriptions?.length > 0 ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-slate-100 text-slate-500'}`}>
                                  {visit.prescriptions?.length || 0}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center print:hidden">
                                <div className="flex items-center justify-center gap-3">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedVisit(visit); }}
                                    className="p-1.5 text-[#1434A4] bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                                    title="View"
                                    suppressHydrationWarning
                                  >
                                    <Eye size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Print Only Full Report Layout */}
                    <div className="hidden print:block w-full bg-white text-black text-right" dir="rtl">
                      <h2 className="text-2xl font-bold text-center border-b-2 border-black pb-4 mb-6">
                        Daily Clinic Report - {getDateLabel(group.date)}
                      </h2>
                      
                      <div className="flex justify-between items-center mb-8 font-bold text-lg border-2 border-black p-4 rounded-xl">
                        <div>Total Visits: {group.totalVisits}</div>
                        <div>Total Prescriptions: {group.totalPrescriptions}</div>
                        <div>Prescribed Meds: {group.totalMedications}</div>
                      </div>

                      {group.visits.map((v, i) => (
                        <div key={v.id} className="mb-8 p-6 border-2 border-gray-400 rounded-xl break-inside-avoid">
                          <div className="flex justify-between items-center border-b-2 border-gray-300 pb-3 mb-4">
                            <div className="font-bold text-xl text-[#1434A4]">{i + 1}. {v.patients?.full_name || 'Unknown Patient'}</div>
                            <div className="text-gray-600 font-semibold text-lg">{formatCairoTime(v.visit_date)}</div>
                          </div>
                          {v.diagnosis && <div className="mb-4 text-lg"><strong>Diagnosis:</strong> {v.diagnosis}</div>}
                          
                          {/* Eye Measurements */}
                          {v.eye_measurements?.length > 0 && (
                            <div className="mb-6 bg-slate-50 p-4 rounded-lg">
                              <div className="font-bold text-lg mb-2 text-[#1434A4]">Eye Measurements:</div>
                              <table className="w-full text-center border-collapse border border-gray-400 text-sm bg-white">
                                <thead>
                                  <tr className="bg-gray-100 border-b border-gray-400">
                                    <th className="border-l border-gray-400 p-2 text-gray-700">Eye</th>
                                    <th className="border-l border-gray-400 p-2 text-gray-700">SPH</th>
                                    <th className="border-l border-gray-400 p-2 text-gray-700">CYL</th>
                                    <th className="p-2 text-gray-700">Axis</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {v.eye_measurements.map(em => (
                                    <Fragment key={em.id}>
                                      <tr className="border-b border-gray-400">
                                        <td className="border-l border-gray-400 p-2 font-bold text-green-800">Left (OS)</td>
                                        <td className="border-l border-gray-400 p-2 font-mono" dir="ltr">{em.left_sph || '-'}</td>
                                        <td className="border-l border-gray-400 p-2 font-mono" dir="ltr">{em.left_cyl || '-'}</td>
                                        <td className="p-2 font-mono" dir="ltr">{em.left_axis || '-'}</td>
                                      </tr>
                                      <tr className="border-b border-gray-300">
                                        <td className="border-l border-gray-400 p-2 font-bold text-blue-800">Right (OD)</td>
                                        <td className="border-l border-gray-400 p-2 font-mono" dir="ltr">{em.right_sph || '-'}</td>
                                        <td className="border-l border-gray-400 p-2 font-mono" dir="ltr">{em.right_cyl || '-'}</td>
                                        <td className="p-2 font-mono" dir="ltr">{em.right_axis || '-'}</td>
                                      </tr>
                                    </Fragment>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {/* Prescriptions */}
                          {v.prescriptions?.length > 0 && (
                            <div className="mb-2">
                              <div className="font-bold text-lg mb-3 text-[#1434A4]">Prescriptions & Medications:</div>
                              {v.prescriptions.map((rx, rxIdx) => (
                                <div key={rx.id} className="mb-4 pl-4 border-r-4 border-blue-200">
                                  {rx.medications_data?.length > 0 ? (
                                    <ul className="list-decimal list-inside space-y-2 mb-3">
                                      {rx.medications_data.map((med, mIdx) => (
                                        <li key={mIdx} className="text-base">
                                          <strong className="text-gray-900">{med.name}</strong> - <span className="text-gray-700">{med.dosage} {med.frequency ? `• ${med.frequency}` : ''}</span>
                                          {med.duration && <span className="text-gray-500 mr-2 border-r border-gray-300 pr-2">Duration: {med.duration}</span>}
                                          {med.notes && <span className="text-gray-500 mr-2 border-r border-gray-300 pr-2">Note: {med.notes}</span>}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <div className="text-gray-500 mb-2">No medications recorded.</div>
                                  )}
                                  {rx.doctor_notes && (
                                    <div className="text-sm bg-blue-50 p-3 rounded-lg border border-blue-100 mt-2">
                                      <strong className="text-blue-800">Doctor Directions:</strong> {rx.doctor_notes}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}


      <VisitDetailsModal
        isOpen={!!selectedVisit}
        onClose={() => setSelectedVisit(null)}
        visit={selectedVisit}
      />
    </div>
  )
}