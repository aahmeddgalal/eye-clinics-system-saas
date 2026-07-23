'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Activity, Menu, X, LayoutDashboard } from 'lucide-react'

export default function PublicHeader({ isAdmin }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  
  const isHomePage = pathname === '/'

  useEffect(() => {
    if (!isHomePage) {
      setScrolled(true)
      return
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isHomePage])

  const navLinks = [
    { name: 'الرئيسية', href: '/#home' },
    { name: 'عن د. صبري', href: '/#about' },
    { name: 'الخدمات', href: '/#services' },
    { name: 'التكنولوجيا', href: '/#equipment' },
    { name: 'اتصل بنا', href: '/#contact' },
  ]

  const handleNavClick = (e, href) => {
    if (isHomePage && href.startsWith('/#')) {
      e.preventDefault();
      const targetId = href.replace('/#', '');
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', `#${targetId}`);
      }
      setMobileMenuOpen(false);
    }
  }

  return (
    <>
    <header 
      className={`fixed top-0 w-full z-50 transition-all duration-300 print:hidden ${
        scrolled 
          ? 'bg-white/90 backdrop-blur-md shadow-sm py-4' 
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
        {/* i want to add the doctors logo here :) */}
          {/* <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm group-hover:shadow-md ${scrolled ? 'bg-[#1434A4] text-white' : 'bg-white text-[#1434A4]'}`}>
            <Activity size={24} strokeWidth={2.5} />
          </div> */}

          <div>
            <h1 className={`font-bold text-xl tracking-wide transition-colors ${scrolled ? 'text-slate-900' : 'text-white'}`}>
              دكتور صبري عياد
            </h1>
            <p className={`text-[12px] tracking-widest uppercase transition-colors ${scrolled ? 'text-[#1434A4]' : 'text-blue-200'}`}>
              التميز في العناية بالعيون
            </p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className={`text-sm font-semibold transition-colors hover:text-[#38BDF8] ${scrolled ? 'text-slate-600' : 'text-white/90'}`}
            >
              {link.name}
            </Link>
          ))}
          
          {isAdmin ? (
            <Link 
              href="/dashboard"
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 ${
                scrolled 
                  ? 'bg-[#1434A4] text-white shadow-blue-900/20' 
                  : 'bg-white text-[#1434A4] shadow-black/10'
              }`}
            >
              <LayoutDashboard size={18} />
              لوحة التحكم
            </Link>
          ) : (
            <Link 
              href="/login"
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${
                scrolled 
                  ? 'bg-[#1434A4] text-white shadow-blue-900/20' 
                  : 'bg-white text-[#1434A4] shadow-black/10'
              }`}
            >
              بوابة الإدارة
            </Link>
          )}
        </nav>

        {/* Mobile Toggle */}
        {!pathname.startsWith('/dashboard') && (
          <button 
            className={`lg:hidden p-2 transition-colors ${scrolled ? 'text-slate-900' : 'text-white'}`}
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={28} />
          </button>
        )}

      </div>
    </header>

      {/* Mobile Menu */}
      <motion.div 
        initial={{ opacity: 0, x: '100%' }}
        animate={{ opacity: mobileMenuOpen ? 1 : 0, x: mobileMenuOpen ? 0 : '100%' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed inset-0 z-50 bg-white lg:hidden flex flex-col"
        style={{ pointerEvents: mobileMenuOpen ? 'auto' : 'none' }}
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1434A4] text-white flex items-center justify-center shadow-md">
              <Activity size={24} strokeWidth={2.5} />
            </div>
            <h1 className="font-bold text-xl text-slate-900">دكتور صبري عياد</h1>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex flex-col p-6 gap-6">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href}
              onClick={(e) => {
                if (isHomePage && link.href.startsWith('/#')) {
                  handleNavClick(e, link.href);
                } else {
                  setMobileMenuOpen(false);
                }
              }}
              className="text-xl font-bold text-slate-800 hover:text-[#1434A4]"
            >
              {link.name}
            </Link>
          ))}
          <div className="h-px bg-slate-100 my-4" />
          
          {isAdmin ? (
            <Link 
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-4 bg-[#1434A4] text-white text-center rounded-xl font-bold text-lg shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
            >
              <LayoutDashboard size={20} />
              لوحة التحكم
            </Link>
          ) : (
            <Link 
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-4 bg-[#1434A4] text-white text-center rounded-xl font-bold text-lg shadow-lg shadow-blue-900/20"
            >
              الدخول لبوابة الإدارة
            </Link>
          )}
        </nav>
      </motion.div>
    </>
  )
}
