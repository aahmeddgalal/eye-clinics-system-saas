'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar as CalendarIcon, User, Phone, Activity } from 'lucide-react'

export default function BookingModal({ isOpen, onClose }) {
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    phone: '',
    maritalStatus: '',
    preferredDay: ''
  })

  const [nameError, setNameError] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleChange = (e) => {
    if (e.target.name === 'fullName') {
      setNameError('')
    }
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // التحقق من أن الاسم رباعي
    const nameWords = formData.fullName.trim().split(/\s+/)
    if (nameWords.length < 4) {
      setNameError('عذراً، يرجى إدخال الاسم رباعياً (أربعة أسماء على الأقل)')
      return
    }

    // بناء رسالة الواتساب بالتنسيق الجديد المريح للعين
    const message = `مرحبا دكتور صبري\n\nانا ${formData.fullName}\nعاوز/ه احجز معاد يوم ${formData.preferredDay}\n\nالسن: ${formData.age}\nالحاله الاجتماعية: ${formData.maritalStatus}\nرقم الهاتف: ${formData.phone}`

    // تشفير النص للرابط
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/201007336823?text=${encodedMessage}`

    // توجيه المستخدم
    window.open(whatsappUrl, '_blank')
    onClose()
  }

  if (!mounted) return null

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center px-4 sm:px-6">

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0a194f]/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
          >

            {/* Header */}
            <div className="bg-[#1434A4] p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 end-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-1/2 rtl:translate-x-1/3" />

              <button
                onClick={onClose}
                className="absolute top-4 end-4 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white text-[#1434A4] rounded-xl flex items-center justify-center">
                  <Activity size={24} strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl font-bold tracking-wide">احجز استشارتك</h2>
              </div>
              <p className="text-blue-200 text-sm font-light mt-2">
                املأ التفاصيل أدناه لطلب موعد عبر الواتساب.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-2">
                    <User size={14} className="text-[#38BDF8]" /> الاسم رباعي
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border ${nameError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-[#D1D5DB] focus:ring-[#1434A4] focus:border-[#1434A4]'} focus:ring-2 outline-none bg-white text-[#111827] placeholder-[#9CA3AF] transition-all text-sm`}
                    placeholder="أدخل اسمك الكامل (رباعي)"
                  />
                  {nameError && (
                    <p className="text-red-500 text-xs mt-1.5 font-semibold">{nameError}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Age */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">العمر</label>
                    <input
                      type="number"
                      name="age"
                      required
                      min="0"
                      max="120"
                      value={formData.age}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-white text-[#111827] placeholder-[#9CA3AF] transition-all text-sm"
                      placeholder="مثال: 35"
                    />
                  </div>

                  {/* Marital Status - تم تغيير القيم للعربية */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">الحالة الاجتماعية</label>
                    <select
                      name="maritalStatus"
                      required
                      value={formData.maritalStatus}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-white text-[#111827] placeholder-[#9CA3AF] transition-all text-sm"
                    >
                      <option value="">-- اختر --</option>
                      <option value="أعزب">أعزب</option>
                      <option value="متزوج">متزوج</option>
                      <option value="أخرى">أخرى</option>
                    </select>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-2">
                    <Phone size={14} className="text-[#38BDF8]" /> رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-white text-[#111827] placeholder-[#9CA3AF] transition-all text-sm text-end"
                    dir="ltr"
                    placeholder="رقم الموبايل"
                  />
                </div>

                {/* Preferred Visit Day - تم تغيير القيم للعربية */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-2">
                    <CalendarIcon size={14} className="text-[#38BDF8]" /> يوم الزيارة المفضل
                  </label>
                  <select
                    name="preferredDay"
                    required
                    value={formData.preferredDay}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-white text-[#111827] placeholder-[#9CA3AF] transition-all text-sm"
                  >
                    <option value="">-- اختر يوماً --</option>
                    <option value="السبت">السبت</option>
                    <option value="الإثنين">الإثنين</option>
                    <option value="الثلاثاء">الثلاثاء</option>
                    <option value="الأربعاء">الأربعاء</option>
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#128C7E] hover:bg-[#075E54] text-white rounded-xl font-bold text-base transition-colors shadow-lg shadow-[#128C7E]/20 flex justify-center items-center gap-2"
                >
                  المتابعة إلى الواتساب
                </button>
                <p className="text-center text-xs text-slate-400 mt-4">
                  بالحجز، أنت توافق على سياسات الاستشارة في عيادتنا.
                </p>
              </div>

            </form>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}