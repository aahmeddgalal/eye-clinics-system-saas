'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Loader2, FileWarning } from 'lucide-react'

export function getStoragePath(url) {
  if (!url) return null;
  if (!url.startsWith('http')) return url;
  
  const bucketString = '/object/public/patient-files/';
  const index = url.indexOf(bucketString);
  if (index !== -1) {
    return url.substring(index + bucketString.length);
  }
  return url;
}

export default function SecureAttachment({ fileUrl, fileType, description, className, renderAsLink = false }) {
  const [signedUrl, setSignedUrl] = useState(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSignedUrl() {
      try {
        const path = getStoragePath(fileUrl)
        if (!path) {
          setError(true)
          setLoading(false)
          return
        }

        const supabase = createClient()
        const { data, error } = await supabase.storage
          .from('patient-files')
          .createSignedUrl(path, 3600) // 1 hour expiry

        if (error || !data) {
          console.error("Error generating signed URL:", error)
          setError(true)
        } else {
          setSignedUrl(data.signedUrl)
        }
      } catch (err) {
        console.error("Unexpected error fetching signed URL:", err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchSignedUrl()
  }, [fileUrl])

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 rounded-lg animate-pulse ${className}`}>
        <Loader2 className="animate-spin text-slate-400" size={24} />
      </div>
    )
  }

  if (error || !signedUrl) {
    return (
      <div className={`flex flex-col items-center justify-center bg-red-50 text-red-500 rounded-lg p-4 border border-red-100 ${className}`}>
        <FileWarning size={32} className="mb-2" />
        <span className="text-sm font-semibold">تعذر تحميل الملف</span>
        <span className="text-xs mt-1 text-center">قد يكون الملف غير موجود أو لا تملك صلاحية الوصول</span>
      </div>
    )
  }

  const isImage = fileType === 'Image'

  if (isImage) {
    return (
      <img 
        src={signedUrl} 
        alt={description || 'مرفق'} 
        className={className}
        loading="lazy"
      />
    )
  }

  if (renderAsLink) {
    return (
      <a href={signedUrl} target="_blank" rel="noreferrer" className={className}>
        فتح الملف (PDF)
      </a>
    )
  }

  return (
    <iframe 
      src={`${signedUrl}#toolbar=0`} 
      className={className}
      title={description || 'مرفق PDF'}
    />
  )
}
