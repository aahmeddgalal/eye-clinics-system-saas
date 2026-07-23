'use client'

import { useState } from 'react'
import { Activity } from 'lucide-react'
import VisitDetailsModal from '@/components/visits/VisitDetailsModal'
import { formatCairoTime } from '@/utils/timezone'

export default function PatientVisitsList({ visits }) {
  const [selectedVisit, setSelectedVisit] = useState(null)

  if (!visits || visits.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
        <Activity size={32} className="mx-auto text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-600">No visits recorded yet.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {visits.map((visit) => (
          <div 
            key={visit.id} 
            onClick={() => setSelectedVisit(visit)}
            className="p-5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-[#1434A4] transition-all cursor-pointer shadow-sm hover:shadow-md group"
          >
            <div className="flex justify-between items-center mb-3 border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded-md">
                {formatCairoTime(visit.visit_date)}
              </span>
              <span className="text-sm font-bold text-[#1434A4]">
                {new Date(visit.visit_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <p className="text-sm text-slate-700 font-bold mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {visit.visit_diseases?.length > 0 
                ? visit.visit_diseases.map(vd => vd.diseases?.name).filter(Boolean).join(' • ')
                : visit.diagnosis || 'No specific diagnosis'}
            </p>
            {visit.notes && (
              <p className="text-sm text-slate-500 bg-white p-3 rounded-lg border border-slate-100 mt-2 truncate">
                {visit.notes}
              </p>
            )}
            <div className="mt-3 text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
              Click to view full details &rarr;
            </div>
          </div>
        ))}
      </div>

      <VisitDetailsModal 
        isOpen={!!selectedVisit}
        onClose={() => setSelectedVisit(null)}
        visit={selectedVisit}
      />
    </>
  )
}
