'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  Activity, 
  Pill, 
  CalendarClock,
  CalendarCheck,
  Megaphone, 
  Settings,
  X,
  FileText,
  Eye,
  Trash2,
  Database
} from 'lucide-react'

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Patients', href: '/dashboard/patients', icon: Users },
  { name: 'Diseases', href: '/dashboard/diseases', icon: Activity },
  { name: 'Medications', href: '/dashboard/medications', icon: Pill },
  { name: 'قائمة اليوم', href: '/dashboard/queue', icon: CalendarClock },
  { name: 'Visits', href: '/dashboard/visits', icon: CalendarCheck },
  { name: 'Backup', href: '/dashboard/backup', icon: Database },
  { name: 'Announcements', href: '/dashboard/announcements', icon: Megaphone },
  { name: 'Trash', href: '/dashboard/trash', icon: Trash2 },
  // { name: 'الإعدادات', href: '/dashboard/settings', icon: Settings },
]

export default function Sidebar({ isOpen, setIsOpen }) {
  const pathname = usePathname()

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isOpen && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      {/* Mobile overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] lg:hidden transition-all duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar container */}
      <aside 
        className={`fixed top-0 start-0 z-[100] h-screen w-[280px] bg-[#1434A4] text-white transition-transform duration-300 ease-in-out lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:rounded-3xl lg:shadow-[0_15px_40px_rgba(20,52,164,0.15)] ${
          isOpen ? 'translate-x-0 shadow-[20px_0_40px_rgba(0,0,0,0.5)]' : 'translate-x-full rtl:translate-x-full lg:translate-x-0 lg:rtl:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between h-20 px-6 border-b border-white/10 lg:hidden">
          <div className="flex items-center gap-3">
            <span className="font-bold text-xl tracking-wide">Management Tools</span>
          </div>
          <button 
            className="text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100vh-5rem)] lg:h-full justify-between overflow-y-auto p-5 custom-scrollbar">
          <nav className="space-y-3">
            {navItems.map((item) => {
              const Icon = item.icon
              const isDashboard = item.href === '/dashboard'
              const isActive = isDashboard 
                ? pathname === '/dashboard'
                : pathname === item.href || pathname.startsWith(`${item.href}/`)
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                    isActive 
                      ? 'bg-white text-[#1434A4] shadow-[0_0_20px_rgba(255,255,255,0.4)] font-bold translate-x-1 rtl:-translate-x-1 scale-[1.02]' 
                      : 'text-white/80 hover:bg-white/10 hover:text-white font-medium hover:translate-x-1 hover:rtl:-translate-x-1 hover:scale-[1.02]'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon size={20} className={isActive ? 'text-[#1434A4]' : 'text-white/70 group-hover:text-white'} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="mt-8 p-4 bg-[#102a83] rounded-xl border border-white/5">
            <h4 className="text-sm font-semibold text-white mb-1">Logged in as Doctor</h4>
            <p className="text-xs text-white/60 mb-3">Dr. Sabry Ayad</p>
            <form action="/auth/signout" method="post">
              <button type="submit" className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-100 hover:text-white text-sm font-medium rounded-lg transition-colors" suppressHydrationWarning>
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  )
}
