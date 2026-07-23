'use client'

import { MapPin, Phone, Mail, Clock } from 'lucide-react'

export default function ContactFooter() {
  return (
    <footer id="contact" className="bg-[#0a194f] text-white pt-24 pb-12 relative z-10 mt-auto">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
        
        {/* Brand */}
        <div className="col-span-1 lg:col-span-1">
          <h2 className="text-2xl font-bold mb-4">دكتور صبري عياد</h2>
          <p className="text-blue-200 text-sm leading-relaxed opacity-80 mb-6">
            رعاية عيون متميزة تجمع بين الخبرة الجراحية العالمية وأحدث تكنولوجيا التشخيص.
          </p>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="font-bold text-lg mb-6">اتصل بنا</h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-3 text-blue-200 text-sm">
              <MapPin size={18} className="text-[#38BDF8] shrink-0 mt-0.5" />
              <span>شبين الكوم، المنوفية</span>
            </li>
            <li className="flex items-center gap-3 text-blue-200 text-sm">
              <Phone size={18} className="text-[#38BDF8] shrink-0" />
              <span dir="ltr">+20 100 733 6823</span>
            </li>
          </ul>
        </div>

        {/* Hours */}
        <div>
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <Clock size={20} className="text-[#38BDF8]" />
            ساعات العمل
          </h3>
          <ul className="space-y-4">
            <li className="flex justify-between text-blue-200 text-sm border-b border-white/10 pb-2">
              <span>الأيام</span>
              <span className="font-semibold">السبت، الاتنين، التلات، الاربع</span>
            </li>
            <li className="flex justify-between text-blue-200 text-sm border-b border-white/10 pb-2">
              <span>الوقت</span>
              <span className="font-semibold" dir="rtl">من 7 مساءً إلى 10 مساءً</span>
            </li>
          </ul>
        </div>

        <a
          href="https://maps.app.goo.gl/yWWjtxFSKQSUeu3Z7"
          target="_blank"
          rel="noopener noreferrer"
          className="block h-48 bg-[#1434A4] rounded-2xl overflow-hidden relative border border-white/10 shadow-lg shadow-[#0a194f]/50 group cursor-pointer transition-transform hover:-translate-y-1"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
          <div className="absolute inset-0 flex items-center justify-center flex-col text-center p-4">
            <MapPin size={32} className="text-[#38BDF8] mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold">عرض على خرائط جوجل</span>
          </div>
        </a>

      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-blue-200/60">
        <p>&copy; {new Date().getFullYear()} دكتور صبري عياد. جميع الحقوق محفوظة.</p>
        
        <div className="flex items-center gap-2 font-medium text-blue-200">
          <a
            href="https://github.com/aahmeddgalal"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-[#38BDF8] transition-colors"
            title="GitHub Repository"
          >
          <span>(:Developed by Galileo</span>
          </a>
          <a 
            href="https://github.com/aahmeddgalal" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-white hover:text-[#38BDF8] transition-colors"
            title="GitHub Repository"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-github"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
          </a>
        </div>
      </div>
    </footer>
  )
}
