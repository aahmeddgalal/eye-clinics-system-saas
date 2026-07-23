'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { FileText, Image as ImageIcon, Trash2, Maximize, X, Loader2 } from 'lucide-react'
import { deleteAttachmentAction } from '@/app/dashboard/attachments/actions'
import { formatCairoDate } from '@/utils/timezone'
import SecureAttachment from './SecureAttachment'

export default function AttachmentsGallery({ attachments, patientId, visits = [] }) {
  const [deletingId, setDeletingId] = useState(null)
  const [fullscreenFile, setFullscreenFile] = useState(null)

  const handleDelete = async (id, fileUrl) => {
    if (!confirm("Are you sure you want to move this file to trash?")) return

    setDeletingId(id)
    await deleteAttachmentAction(id, fileUrl, patientId)
    setDeletingId(null)
  }

  if (!attachments || attachments.length === 0) {
    return (
      <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100 border-dashed mt-4">
        <p className="text-sm text-slate-500">No scans or documents uploaded.</p>
      </div>
    )
  }

  // Group attachments
  const groupedAttachments = attachments.reduce((acc, file) => {
    const key = file.visit_id || 'general';
    if (!acc[key]) acc[key] = [];
    acc[key].push(file);
    return acc;
  }, {});

  return (
    <div className="space-y-8 mt-4">
      {Object.entries(groupedAttachments).map(([visitId, files]) => {
        let title = "General Attachments (No Visit)";
        if (visitId !== 'general') {
          const visit = visits.find(v => v.id === visitId);
          if (visit) {
            title = `Visit Attachments ${formatCairoDate(visit.visit_date)}`;
          }
        }

        return (
          <div key={visitId} className="space-y-3">
            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">{title}</h4>
            <div className="flex flex-col gap-6">
              {files.map((file) => {
                const isImage = file.file_type === 'Image'
                
                return (
                  <div key={file.id} className="relative rounded-xl bg-slate-50 border border-slate-200 p-4 group overflow-hidden shadow-sm">
                    {/* Header: Description and Actions */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {isImage ? <ImageIcon size={18} className="text-slate-500" /> : <FileText size={18} className="text-slate-500" />}
                          <span className="font-semibold text-slate-800">{file.description || (isImage ? 'Attached Image' : 'PDF Document')}</span>
                        </div>
                        <span className="text-xs text-slate-500">{formatCairoDate(file.uploaded_at)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setFullscreenFile(file)}
                          className="p-2 text-slate-400 hover:text-[#1434A4] hover:bg-white rounded-lg transition-colors"
                          title="Full Screen View"
                        >
                          <Maximize size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(file.id, file.file_url)}
                          disabled={deletingId === file.id}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
                          title="Delete File"
                        >
                          {deletingId === file.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Content Preview */}
                    <div 
                      className={`w-full overflow-hidden rounded-lg border border-slate-200 bg-white ${isImage ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''}`}
                      onClick={() => isImage && setFullscreenFile(file)}
                    >
                      <SecureAttachment
                        fileUrl={file.file_url}
                        fileType={file.file_type}
                        description={file.description}
                        className={isImage ? "w-full h-auto max-h-[800px] object-contain" : "w-full h-[600px] border-0"}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Fullscreen Modal */}
      {fullscreenFile && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
          <button 
            onClick={() => setFullscreenFile(null)}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[10000]"
            title="Close"
          >
            <X size={24} />
          </button>
          
          <div className="w-full h-full flex flex-col items-center justify-center pt-8">
            <div className="w-full max-w-7xl h-[85vh] relative rounded-xl overflow-hidden shadow-2xl bg-white flex items-center justify-center">
               <SecureAttachment
                 fileUrl={fullscreenFile.file_url}
                 fileType={fullscreenFile.file_type}
                 description={fullscreenFile.description}
                 className={fullscreenFile.file_type === 'Image' ? "w-full h-full object-contain" : "w-full h-full border-0"}
               />
            </div>
            {fullscreenFile.description && (
              <div className="mt-4 text-white text-lg font-medium z-[10000]">
                {fullscreenFile.description}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
