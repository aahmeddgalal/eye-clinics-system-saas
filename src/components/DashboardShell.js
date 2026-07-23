'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'

export default function DashboardShell({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 min-h-[85vh] flex gap-8 print:max-w-none print:px-0 print:py-0 print:block">
      {/* Mobile Sidebar Toggle - visible only on small screens */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40 print:hidden">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="bg-[#1434A4] text-white p-4 rounded-full shadow-lg shadow-blue-900/30"
        >
          Management Tools
        </button>
      </div>

      {/* Sidebar */}
      <div className="print:hidden">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      </div>
      
      {/* Main Content Area */}
      <main className="flex-1 w-full min-w-0 p-4 md:p-6 overflow-x-hidden custom-scrollbar print:p-0 print:overflow-visible">
        {children}
      </main>
    </div>
  )
}
