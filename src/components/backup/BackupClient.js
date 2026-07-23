'use client'

import { useState, useEffect, useRef } from 'react'
import { exportBackupAction, importBackupAction } from '@/app/dashboard/backup/actions'
import { Download, Upload, AlertTriangle, CheckCircle, Loader2, Database, Clock } from 'lucide-react'

export default function BackupClient() {
  const [lastBackupDate, setLastBackupDate] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  const fileInputRef = useRef(null)

  useEffect(() => {
    // Load last backup date from localStorage
    const stored = localStorage.getItem('last_backup_date')
    if (stored) {
      setLastBackupDate(stored)
    }
  }, [])

  const handleExport = async (incremental = true) => {
    setIsExporting(true)
    setMessage({ type: '', text: '' })
    
    try {
      const sinceDate = incremental ? lastBackupDate : null
      const res = await exportBackupAction(sinceDate)
      
      if (!res.success) {
        throw new Error(res.error)
      }

      // Create downloadable file
      const blob = new Blob([JSON.stringify(res.backup)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `clinic_backup_${incremental ? 'incremental' : 'full'}_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      // Update last backup date
      const now = new Date().toISOString()
      localStorage.setItem('last_backup_date', now)
      setLastBackupDate(now)

      setMessage({ type: 'success', text: 'تم تحميل النسخة الاحتياطية بنجاح.' })
    } catch (error) {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء النسخ الاحتياطي: ' + error.message })
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!confirm('هل أنت متأكد من رغبتك في استعادة هذه النسخة؟ سيتم دمج البيانات الجديدة مع البيانات الحالية.')) {
      e.target.value = ''
      return
    }

    setIsImporting(true)
    setMessage({ type: '', text: '' })

    try {
      const text = await file.text()
      const backupData = JSON.parse(text)

      const res = await importBackupAction(backupData)
      
      if (!res.success) {
        throw new Error(res.error)
      }

      setMessage({ type: 'success', text: 'تمت استعادة البيانات بنجاح.' })
    } catch (error) {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء الاستعادة: تأكد من أن الملف سليم.' })
      console.error(error)
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      
      {/* Export Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-50 text-[#1434A4] rounded-lg">
            <Download size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">نسخ احتياطي</h2>
        </div>
        <p className="text-slate-600 text-sm mb-6 flex-1">
          قم بتحميل بيانات العيادة للاحتفاظ بها في مكان آمن. ننصح بعمل نسخ احتياطي بشكل دوري.
        </p>

        {lastBackupDate && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-6 flex items-center gap-2 text-sm text-slate-600">
            <Clock size={16} />
            آخر نسخة تم أخذها: <span className="font-bold text-slate-800" dir="ltr">{new Date(lastBackupDate).toLocaleString('ar-EG')}</span>
          </div>
        )}

        <div className="flex flex-col gap-3 mt-auto">
          <button
            onClick={() => handleExport(true)}
            disabled={isExporting}
            className="w-full py-3 px-4 bg-[#1434A4] hover:bg-[#102a83] text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Database size={18} />}
            نسخ احتياطي (الجديد فقط)
          </button>
          
          <button
            onClick={() => handleExport(false)}
            disabled={isExporting}
            className="w-full py-3 px-4 bg-white border border-[#1434A4] text-[#1434A4] hover:bg-blue-50 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            نسخ احتياطي (كامل)
          </button>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Upload size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">استعادة البيانات</h2>
        </div>
        <p className="text-slate-600 text-sm mb-6 flex-1">
          قم برفع ملف النسخة الاحتياطية الذي قمت بتنزيله سابقاً. سيتم دمج البيانات الجديدة مع البيانات الحالية ولن يتم مسح أي بيانات موجودة.
        </p>

        <div className="mt-auto">
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef}
            onChange={handleImportFileSelect}
            className="hidden" 
            id="backup-upload"
          />
          <label 
            htmlFor="backup-upload"
            className={`w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {isImporting ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
            {isImporting ? 'جاري الاستعادة...' : 'اختر ملف النسخة لاستعادته'}
          </label>
        </div>
      </div>

      {/* Messages */}
      {message.text && (
        <div className={`md:col-span-2 p-4 rounded-lg flex items-center gap-3 border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
          {message.type === 'success' ? <CheckCircle size={20} className="text-emerald-600" /> : <AlertTriangle size={20} className="text-rose-600" />}
          <span className="font-semibold text-sm">{message.text}</span>
        </div>
      )}

    </div>
  )
}
