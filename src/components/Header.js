'use client'

import { Menu, Bell, Search, UserCircle } from 'lucide-react'

export default function Header({ setIsSidebarOpen }) {
  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-30 sticky top-0">
      <div className="flex items-center gap-4">
        <button 
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden transition-colors"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu size={24} />
        </button>
        
        {/* Search Bar - hidden on very small screens */}
        <div className="hidden sm:flex items-center relative">
          <Search className="absolute start-3 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search patients, appointments..." 
            className="ps-10 pe-4 py-2 bg-white border border-[#D1D5DB] rounded-full text-[#111827] placeholder-[#9CA3AF] text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <button className="relative p-2 text-slate-400 hover:text-[#1434A4] hover:bg-blue-50 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 end-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
        
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="hidden sm:block text-end">
            <p className="text-sm font-semibold text-slate-800">Dr. Sabry</p>
            <p className="text-xs text-slate-500">System Admin</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#1434A4] group-hover:ring-2 group-hover:ring-[#1434A4] group-hover:ring-offset-2 transition-all">
            <UserCircle size={28} />
          </div>
        </div>
      </div>
    </header>
  )
}
