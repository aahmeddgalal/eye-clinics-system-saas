'use client'

import { useState, useRef } from 'react'
import { Upload, Loader2, FileWarning } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { createAttachmentAction } from '@/app/dashboard/attachments/actions'
import { formatCairoDate } from '@/utils/timezone'
import imageCompression from 'browser-image-compression'

export default function UploaderComponent({ patientId, visits = [] }) {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedVisitId, setSelectedVisitId] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const fileInputRef = useRef(null)

  const supabase = createClient()

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("حجم الملف يتجاوز الحد المسموح (10 ميجابايت).")
      return
    }

    // Validate type
    const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf'
    if (!isValidType) {
      setError("صيغة الملف غير مدعومة. يرجى رفع صورة أو ملف PDF.")
      return
    }

    setSelectedFile(file)
    setError(null)
  }

  const handleConfirmUpload = async () => {
    if (!selectedFile) return
    setIsUploading(true)
    setError(null)

    try {
      let fileToUpload = selectedFile;
      const isImage = fileToUpload.type.startsWith('image/');

      // If it's an image and larger than 1MB, compress it
      if (isImage && fileToUpload.size > 1024 * 1024) {
        try {
          const options = {
            maxSizeMB: 1, // Target approximately 1MB
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            initialQuality: 0.8,
          };
          fileToUpload = await imageCompression(fileToUpload, options);
        } catch (compressionError) {
          console.error('Image compression failed, falling back to original file', compressionError);
        }
      }

      // 1. Prepare unique file path
      const fileExt = fileToUpload.name.split('.').pop() || 'jpg'
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`
      const filePath = `${patientId}/${fileName}`

      // 2. Upload to Supabase Storage (patient-files bucket)
      const { data: storageData, error: storageError } = await supabase
        .storage
        .from('patient-files')
        .upload(filePath, fileToUpload)

      if (storageError) {
        if (storageError.message.includes('Bucket not found')) {
          throw new Error('فشل الرفع: لم يتم العثور على مساحة التخزين (Bucket). يرجى تنفيذ أمر SQL في لوحة تحكم Supabase.')
        }
        if (storageError.message.includes('row violates row-level security policy')) {
          throw new Error('فشل الرفع: لا توجد صلاحيات (RLS Policy). يرجى التأكد من تنفيذ أمر SQL لمنح الصلاحيات.')
        }
        throw new Error(`فشل الرفع: ${storageError.message}`)
      }

      // 3. Get Public URL
      const { data: publicUrlData } = supabase
        .storage
        .from('patient-files')
        .getPublicUrl(filePath)

      const fileUrl = publicUrlData.publicUrl
      const fileType = fileToUpload.type.startsWith('image/') ? 'Image' : 'PDF'

      // 4. Save to Database using Server Action
      const dbResult = await createAttachmentAction(patientId, fileUrl, fileType, selectedVisitId || null, description || null)

      if (dbResult?.error) {
        throw new Error(`خطأ في حفظ البيانات: ${dbResult.error}`)
      }

    } catch (err) {
      console.error(err)
      setError(err.message || 'حدث خطأ غير معروف أثناء رفع الملف.')
    } finally {
      setIsUploading(false)
      setSelectedFile(null)
      setDescription('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setDescription('')
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      
        {!selectedFile ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-bold text-[#1434A4] bg-blue-50 border border-blue-100 px-4 py-2.5 rounded-lg hover:bg-blue-100 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Upload size={16} />
              اختيار ملف لإرفاقه
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700 truncate max-w-[200px]" title={selectedFile.name}>
                {selectedFile.name}
              </span>
              <span className="text-xs text-slate-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedVisitId}
                onChange={(e) => setSelectedVisitId(e.target.value)}
                disabled={isUploading}
                className="w-full sm:w-1/3 text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#1434A4] focus:ring-1 focus:ring-[#1434A4] bg-white text-slate-700"
              >
                <option value="">عام (بدون زيارة محددة)</option>
                {visits.map(v => (
                  <option key={v.id} value={v.id}>{v.diagnosis || 'زيارة'} - {formatCairoDate(v.visit_date)}</option>
                ))}
              </select>
              
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف المرفق (اختياري)"
                disabled={isUploading}
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#1434A4] focus:ring-1 focus:ring-[#1434A4] bg-white text-slate-700"
              />
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={handleConfirmUpload}
                disabled={isUploading}
                className="flex-1 text-sm font-bold text-white bg-[#1434A4] px-4 py-2.5 rounded-lg hover:bg-blue-800 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                suppressHydrationWarning
              >
                {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {isUploading ? 'جاري الرفع...' : 'تأكيد الرفع'}
              </button>
              
              <button
                onClick={handleCancel}
                disabled={isUploading}
                className="px-4 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}
        
        {error && (
          <div className="flex items-start gap-2 mt-3 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">
            <FileWarning size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
    </div>
  )
}
