'use client'

import { useState } from 'react'
import { Megaphone, Plus, Trash2, Edit2, Loader2 } from 'lucide-react'
import { createAnnouncementAction, deleteAnnouncementAction, toggleAnnouncementStatusAction } from '@/app/dashboard/announcements/actions'
import { formatCairoDate } from '@/utils/timezone'

export default function AnnouncementsClient({ initialAnnouncements }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loadingId, setLoadingId] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // غيرنا الحالات علشان تناسب الاختيارات الجديدة
  const [durationMode, setDurationMode] = useState('indefinite')

  async function handleAdd(e) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formElement = e.target
    const formData = new FormData(formElement)

    // --------------------------------------------------------
    // معالجة التواريخ لتجنب أخطاء "Invalid Date" في السيرفر
    // --------------------------------------------------------
    let startDate = new Date()
    let endDate = null

    if (durationMode === 'days') {
      const daysCount = parseInt(formData.get('days_count')) || 1
      endDate = new Date(startDate.getTime() + daysCount * 24 * 60 * 60 * 1000)

      // نرسلها للسيرفر على أنها "مخصصة" مع التواريخ المحسوبة
      formData.set('duration', 'custom')
    }
    else if (durationMode === 'custom') {
      const customStart = formData.get('custom_start')
      const customEnd = formData.get('custom_end')

      if (customStart) startDate = new Date(customStart)
      if (customEnd) endDate = new Date(customEnd)

      // التحقق من صحة التواريخ
      if (endDate && startDate > endDate) {
        setError('End date must be after start date.')
        setIsSubmitting(false)
        return
      }
      formData.set('duration', 'custom')
    }
    else {
      formData.set('duration', 'indefinite')
    }

    // تحويل التواريخ للصيغة القياسية التي يفهمها أي Backend
    try {
      formData.set('start_date', startDate.toISOString())
      formData.set('custom_start', startDate.toISOString()) // لتوافق الكود القديم إن وُجد

      if (endDate) {
        formData.set('end_date', endDate.toISOString())
        formData.set('custom_end', endDate.toISOString())
      } else {
        formData.delete('end_date')
        formData.delete('custom_end')
      }
    } catch (err) {
      setError('Invalid date format, please check the entered dates.')
      setIsSubmitting(false)
      return
    }

    // إرسال البيانات
    const result = await createAnnouncementAction(formData)

    if (result?.error) {
      setError(result.error)
    } else {
      setIsModalOpen(false)
      formElement.reset()
      setDurationMode('indefinite') // إعادة تعيين الحالة
    }
    setIsSubmitting(false)
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this announcement?')) return
    setLoadingId(id)
    await deleteAnnouncementAction(id)
    setLoadingId(null)
  }

  async function handleToggleStatus(id, currentStatus) {
    setLoadingId(id)
    await toggleAnnouncementStatusAction(id, !currentStatus)
    setLoadingId(null)
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Announcements</h1>
          <p className="text-slate-500 text-sm mt-1">Manage clinic circulars and notifications.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2.5 bg-[#1434A4] hover:bg-[#102a83] text-white text-sm font-medium rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 hover:scale-[1.02]"
          suppressHydrationWarning
        >
          <Plus size={18} />
          Add Announcement
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        {(!initialAnnouncements || initialAnnouncements.length === 0) ? (
          <div className="text-center py-16 flex flex-col items-center">
            <Megaphone size={48} className="text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-800">No announcements</h3>
            <p className="text-slate-500 mt-2 max-w-md mx-auto text-sm">
              No announcements have been published yet. Click "Add Announcement" to publish a new circular for the clinic staff or patients.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {initialAnnouncements.map((ann) => (
              <div key={ann.id} className={`p-5 rounded-xl border transition-colors group ${ann.is_active ? 'border-slate-100 hover:border-blue-100 bg-white hover:bg-blue-50/30' : 'border-slate-100 bg-slate-50 opacity-75'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{ann.title}</h3>
                    <div className="text-xs text-slate-400 mt-1 space-y-0.5">
                      <div>Published on: {formatCairoDate(ann.created_at)}</div>
                      {ann.start_date && <div>Starts: {formatCairoDate(ann.start_date)}</div>}
                      {ann.end_date && <div>Ends: {formatCairoDate(ann.end_date)}</div>}
                      {!ann.end_date && !ann.start_date && <div>Duration: Indefinite (Ongoing)</div>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(ann.id, ann.is_active)}
                      disabled={loadingId === ann.id}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border ${ann.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300'}`}
                      suppressHydrationWarning
                    >
                      {loadingId === ann.id ? <Loader2 size={14} className="animate-spin" /> : (ann.is_active ? 'Active (Disable)' : 'Archived (Activate)')}
                    </button>

                    <button
                      onClick={() => handleDelete(ann.id)}
                      disabled={loadingId === ann.id}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {loadingId === ann.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>
                {ann.content && <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{ann.content}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h2 className="font-bold text-slate-900 text-lg">Add New Announcement</h2>
            </div>

            <form onSubmit={handleAdd} className="p-6">
              {error && <div className="mb-4 text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Announcement Title</label>
                  <input
                    name="title"
                    required
                    type="text"
                    className="w-full px-4 py-2.5 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none transition-all text-sm bg-white text-[#111827]"
                    placeholder="e.g. Change of working hours in Ramadan"
                    suppressHydrationWarning
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
                  <select
                    value={durationMode}
                    onChange={(e) => setDurationMode(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none transition-all text-sm bg-white text-[#111827]"
                  >
                    <option value="indefinite">Ongoing (No end date)</option>
                    <option value="days">Limit by days</option>
                    <option value="custom">Custom dates (Start and End)</option>
                  </select>
                </div>

                {/* خيار العداد الجديد */}
                {durationMode === 'days' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Number of Days</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        name="days_count"
                        min="1"
                        defaultValue="3"
                        required
                        className="w-full px-4 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] outline-none text-sm bg-white text-[#111827]"
                      />
                      <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Days from now</span>
                    </div>
                  </div>
                )}

                {/* خيار التواريخ المخصصة */}
                {durationMode === 'custom' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Start Date (Optional)</label>
                      <input
                        type="datetime-local"
                        name="custom_start"
                        className="w-full px-4 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] outline-none text-sm bg-white text-[#111827]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                      <input
                        type="datetime-local"
                        name="custom_end"
                        required
                        className="w-full px-4 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] outline-none text-sm bg-white text-[#111827]"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    id="is_active"
                    defaultChecked
                    className="w-4 h-4 text-[#1434A4] rounded border-gray-300 focus:ring-[#1434A4]"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-slate-700">Activate immediately</label>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setDurationMode('indefinite'); }}
                  className="px-4 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 text-sm font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#1434A4] hover:bg-[#102a83] text-white text-sm font-bold rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 hover:scale-[1.02] disabled:opacity-50"
                  suppressHydrationWarning
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}