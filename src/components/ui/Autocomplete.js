'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Search, Loader2 } from 'lucide-react'

export default function Autocomplete({ 
  items = [], 
  value = '', 
  onChange, 
  onAddNew, 
  placeholder = 'Search...', 
  itemName = 'item',
  name,
  required,
  mapArabicToEnglish = true
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const wrapperRef = useRef(null)

  const arabicMap = {
    'ض': 'q', 'ص': 'w', 'ث': 'e', 'ق': 'r', 'ف': 't', 'غ': 'y', 'ع': 'u', 'ه': 'i', 'خ': 'o', 'ح': 'p', 'ج': '[', 'د': ']',
    'ش': 'a', 'س': 's', 'ي': 'd', 'ب': 'f', 'ل': 'g', 'ا': 'h', 'ت': 'j', 'ن': 'k', 'م': 'l', 'ك': ';', 'ط': "'",
    'ئ': 'z', 'ء': 'x', 'ؤ': 'c', 'ر': 'v', 'لا': 'b', 'ى': 'n', 'ة': 'm', 'و': ',', 'ز': '.', 'ظ': '/',
    'أ': 'h', 'إ': 'y', 'آ': 'n' 
  };

  const convertArabicToEnglish = (text) => {
    if (!text || !mapArabicToEnglish) return text;
    // Catch 'ل' or 'g' followed by any form of 'ا' (ا، أ، إ، آ)
    let mapped = text.replace(/(?:\u0644|g)[\u0627\u0623\u0625\u0622]/g, 'b');
    return mapped.split('').map(char => arabicMap[char] || char).join('');
  };

  // Filter and sort items: exact prefix matches first
  const searchValue = (value || '').toLowerCase();
  const filteredItems = items
    .filter(item => item.name?.toLowerCase().includes(searchValue))
    .sort((a, b) => {
      const aName = a.name?.toLowerCase() || '';
      const bName = b.name?.toLowerCase() || '';
      const aStarts = aName.startsWith(searchValue);
      const bStarts = bName.startsWith(searchValue);
      
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      // Secondary sort alphabetically
      return aName.localeCompare(bName);
    });

  const exactMatch = items.find(item => item.name?.trim().toLowerCase() === (value || '').trim().toLowerCase())

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAddNew = async () => {
    if (!value.trim() || isAdding) return
    setIsAdding(true)
    await onAddNew(value.trim())
    setIsAdding(false)
    setIsOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative w-full print:hidden">
      <div className="relative">
        <input
          type="text"
          name={name}
          required={required}
          value={value}
          onChange={(e) => {
            const finalValue = convertArabicToEnglish(e.target.value);
            onChange(finalValue)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none bg-white text-[#111827] placeholder-[#9CA3AF] text-sm pr-10"
          suppressHydrationWarning
        />
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col">
          <div className="overflow-y-auto flex-1">
            {filteredItems.length > 0 ? (
              <ul className="py-1">
                {filteredItems.map(item => (
                  <li 
                    key={item.id}
                    onClick={() => {
                      onChange(item.name)
                      setIsOpen(false)
                    }}
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-slate-800 transition-colors"
                  >
                    {item.name}
                  </li>
                ))}
              </ul>
            ) : (
              value.trim() && (
                <div className="p-3 text-sm text-center text-slate-500">
                  No results found for "{value}"
                </div>
              )
            )}
          </div>

          {value.trim() && !exactMatch && onAddNew && (
            <div className="p-2 border-t border-slate-100 bg-slate-50 rounded-b-lg shrink-0">
              <button
                type="button"
                onClick={handleAddNew}
                disabled={isAdding}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-50"
              >
                {isAdding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Add new {itemName}: "{value.trim()}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
