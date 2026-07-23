'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

// Helper to highlight matching text
function HighlightMatch({ text, query }) {
  if (!query || !text) return <span>{text}</span>
  
  const regex = new RegExp(`(${query})`, 'gi')
  const parts = text.split(regex)
  
  return (
    <span>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <span key={i} className="text-[#1434A4] bg-blue-50 font-bold px-0.5 rounded">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}

export default function AutocompleteSearch({ 
  placeholder = 'بحث...', 
  onSearchAction, 
  onSelect,
  renderItem,
  initialValue = ''
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [query, setQuery] = useState(initialValue)
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef(null)

  // Update initial value if URL changes
  useEffect(() => {
    setQuery(initialValue)
  }, [initialValue])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (query.trim().length >= 1) {
        setIsLoading(true)
        const data = await onSearchAction(query.trim())
        setResults(data || [])
        setIsLoading(false)
        setIsOpen(true)
      } else {
        setResults([])
        setIsOpen(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(handler)
  }, [query, onSearchAction])

  function handleFormSubmit(e) {
    e.preventDefault()
    setIsOpen(false)
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', '1')
    if (query.trim()) {
      params.set('q', query.trim())
    } else {
      params.delete('q')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  function handleItemClick(item) {
    setIsOpen(false)
    onSelect(item)
  }

  return (
    <div ref={wrapperRef} className="relative w-full sm:w-96">
      <form onSubmit={handleFormSubmit} className="relative w-full">
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (query.trim().length > 0) setIsOpen(true) }}
          className="w-full ps-10 pe-10 py-2.5 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none transition-all text-sm bg-white text-[#111827] placeholder-[#9CA3AF]"
          suppressHydrationWarning
        />
        <Search className="absolute start-3 top-3 text-slate-400" size={18} />
        {isLoading && (
          <div className="absolute end-3 top-3 text-[#1434A4]">
            <Loader2 size={18} className="animate-spin" />
          </div>
        )}
      </form>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-80 overflow-y-auto">
          <ul className="py-1">
            {results.map((item) => (
              <li 
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
              >
                {renderItem(item, query, HighlightMatch)}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {isOpen && query.trim().length >= 1 && !isLoading && results.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-4 text-center animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-sm text-slate-500">لا توجد نتائج مطابقة.</p>
        </div>
      )}
    </div>
  )
}
