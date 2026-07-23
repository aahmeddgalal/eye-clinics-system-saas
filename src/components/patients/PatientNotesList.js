'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Plus, Loader2, Edit2, Trash2, X, Check } from 'lucide-react'
import { formatCairoDate } from '@/utils/timezone'
import toast from 'react-hot-toast'
import { createPatientNoteAction, updatePatientNoteAction, deletePatientNoteAction } from '@/app/dashboard/patients/actions'

export default function PatientNotesList({ patientId, notes = [], visits = [] }) {
  const router = useRouter()
  const [localNotes, setLocalNotes] = useState(notes)
  
  // Sync if props change due to router.refresh()
  useEffect(() => {
    setLocalNotes(notes)
  }, [notes])

  const [isAdding, setIsAdding] = useState(false)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [selectedVisitId, setSelectedVisitId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  const [editingId, setEditingId] = useState(null)
  const [editContent, setEditContent] = useState('')

  async function handleAddNote() {
    if (!newNoteContent.trim()) return
    setSubmitting(true)
    const res = await createPatientNoteAction(patientId, newNoteContent, selectedVisitId || null)
    if (res.success && res.data) {
      toast.success('Note added successfully')
      setLocalNotes([res.data, ...localNotes])
      setNewNoteContent('')
      setSelectedVisitId('')
      setIsAdding(false)
      router.refresh()
    } else {
      toast.error(res.error || 'Error occurred while adding note')
    }
    setSubmitting(false)
  }

  async function handleUpdateNote(id) {
    if (!editContent.trim()) return
    setSubmitting(true)
    const res = await updatePatientNoteAction(id, editContent, patientId)
    if (res.success) {
      toast.success('Note updated successfully')
      setLocalNotes(localNotes.map(n => n.id === id ? { ...n, content: editContent } : n))
      setEditingId(null)
      router.refresh()
    } else {
      toast.error(res.error || 'Error occurred while updating note')
    }
    setSubmitting(false)
  }

  async function handleDeleteNote(id) {
    if (!confirm('Are you sure you want to delete this note?')) return
    setSubmitting(true)
    const res = await deletePatientNoteAction(id, patientId)
    if (res.success) {
      toast.success('Note deleted successfully')
      setLocalNotes(localNotes.filter(n => n.id !== id))
      router.refresh()
    } else {
      toast.error(res.error || 'Error occurred while deleting note')
    }
    setSubmitting(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-2 bg-[#1434A4] h-full"></div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-[#1434A4] rounded-lg">
            <FileText size={20} />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Notes Log</h3>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="p-1.5 bg-blue-50 text-[#1434A4] rounded hover:bg-blue-100 transition-colors"
            title="Add new note"
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      {isAdding && (
        <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <select
            value={selectedVisitId}
            onChange={(e) => setSelectedVisitId(e.target.value)}
            disabled={submitting}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 mb-2 outline-none focus:border-[#1434A4] focus:ring-1 focus:ring-[#1434A4] bg-white text-slate-700"
          >
            <option value="">General Note (Shows at the top of the report)</option>
            {visits.map(v => (
              <option key={v.id} value={v.id}>{v.diagnosis || 'Visit'} - {formatCairoDate(v.visit_date)}</option>
            ))}
          </select>
          <textarea
            value={newNoteContent}
            onChange={e => setNewNoteContent(e.target.value)}
            className="w-full text-sm p-3 border border-slate-200 rounded-lg outline-none focus:border-[#1434A4] resize-none"
            placeholder="Write new note here..."
            rows={3}
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <button 
              onClick={() => { setIsAdding(false); setNewNoteContent(''); setSelectedVisitId(''); }}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleAddNote}
              disabled={submitting || !newNoteContent.trim()}
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#1434A4] hover:bg-[#102a83] rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Save
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {localNotes.length === 0 ? (
          <p className="text-sm text-slate-400 italic text-center py-4">No notes recorded.</p>
        ) : (
          localNotes.map(note => (
            <div key={note.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100 group relative">
              {editingId === note.id ? (
                <div>
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    className="w-full text-sm p-3 border border-slate-200 rounded-lg outline-none focus:border-[#1434A4] resize-none"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button 
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleUpdateNote(note.id)}
                      disabled={submitting || !editContent.trim()}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Update
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xs text-slate-400 font-medium">
                      {formatCairoDate(note.created_at)}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditingId(note.id); setEditContent(note.content); }}
                        className="p-1 text-slate-400 hover:text-[#1434A4] transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
