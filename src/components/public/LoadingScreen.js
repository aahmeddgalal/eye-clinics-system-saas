'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Activity } from 'lucide-react'

export default function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate initial loading time
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#1434A4]"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-20 h-20 bg-white rounded-2xl shadow-2xl flex items-center justify-center text-[#1434A4] mb-6 relative overflow-hidden"
          >
            {/* also here i wasnt to add the logo  */}
            <Activity size={40} strokeWidth={2.5} className="relative z-10" />
            <motion.div 
              animate={{ 
                x: ['100%', '-100%'] 
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5, 
                ease: 'linear' 
              }}
              className="absolute inset-0 bg-gradient-to-l from-transparent via-blue-100/50 to-transparent skew-x-12"
            />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-white text-3xl font-bold tracking-wide"
          >
            دكتور صبري عياد
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-blue-200 mt-2 text-sm tracking-widest uppercase"
          >
            التميز في طب العيون
          </motion.p>


            <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-white hover:text-[#38BDF8] transition-colors"
            >(:Developed by Galileo</motion.span>
          
        </motion.div>
      )}
    </AnimatePresence>
  )
}
