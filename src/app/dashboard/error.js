'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function DashboardError({ error, reset }) {
  useEffect(() => {
    console.error('Dashboard Error:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
      <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm border border-red-100">
        <AlertTriangle size={36} />
      </div>
      
      <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-wide">عذراً، حدث خطأ غير متوقع</h2>
      
      <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
        يبدو أن هناك مشكلة في تحميل هذه الصفحة. قد يكون ذلك بسبب انقطاع الاتصال بقاعدة البيانات أو خطأ في النظام.
      </p>
      
      <button
        onClick={() => reset()}
        className="px-8 py-3 bg-[#1434A4] hover:bg-[#0a227e] text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5 flex items-center gap-2"
      >
        <RefreshCw size={18} />
        حاول مرة أخرى
      </button>

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-12 text-left bg-slate-900 text-red-400 p-4 rounded-xl text-sm max-w-2xl overflow-auto w-full shadow-inner" dir="ltr">
          <p className="font-bold text-white mb-2">Development Error Details:</p>
          <pre className="whitespace-pre-wrap">{error.message}</pre>
        </div>
      )}
    </div>
  )
}
