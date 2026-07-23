'use client'

import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { ArrowRight, Calendar, Users, Award } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import BookingModal from './BookingModal'


function AnimatedCounter({ from, to, duration, suffix = "" }) {
  const count = useMotionValue(from)
  const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString() + suffix)

  useEffect(() => {
    const controls = animate(count, to, { duration: duration, ease: "easeOut" })
    return controls.stop
  }, [count, to, duration])

  return <motion.span>{rounded}</motion.span>
}


export default function HeroSection({ announcement = 'نستقبل مرضى جدد' }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      window.scrollTo(0, 0);
    }, []);

    return (
      <section id="home" className="relative w-full h-screen min-h-[600px] flex items-center justify-center overflow-hidden">

      {/* Background Image with Parallax effect */}
      <motion.div
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 z-0"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(/doctorhome.png)',
            backgroundPosition: 'center 20%'
          }}
        />
        {/* Luxury Dark Blue Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-l from-[#0a194f]/90 via-[#1434A4]/70 to-transparent" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col items-start mt-16 lg:mt-48">

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-blue-100 text-sm font-medium mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
          {announcement}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold text-white max-w-3xl leading-tight"
        >
          رؤية العالم <span className="text-[#38BDF8]">بوضوح تام.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-6 text-lg md:text-xl text-blue-100 max-w-xl font-light leading-relaxed"
        >
          بقيادة د. صبري عياد، تجمع عيادتنا بين أحدث تكنولوجيا التشخيص والخبرة الجراحية العالمية لحماية واستعادة رؤيتك.
        </motion.p>

        {/* الإحصائيات (العدادات المتحركة) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-8 flex items-center gap-8 border-y border-white/10 py-4 w-full max-w-xl"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-lg text-[#38BDF8]">
              <Users size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white flex items-center gap-1">
                +<AnimatedCounter from={40000} to={50000} duration={4} />
              </div>
              <p className="text-sm text-blue-200">مريض سعيد</p>
            </div>
          </div>

          <div className="w-px h-12 bg-white/10"></div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-lg text-[#38BDF8]">
              <Award size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white flex items-center gap-1">
                +<AnimatedCounter from={0} to={25} duration={4} />
              </div>
              <p className="text-sm text-blue-200">سنة خبرة</p>
            </div>
          </div>
        </motion.div>

        {/* الأزرار */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-8 flex flex-col sm:flex-row gap-4"
        >
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-8 py-4 bg-[#38BDF8] hover:bg-[#0284c7] text-white rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 hover:-translate-y-1"
          >
            <Calendar size={20} />
            احجز استشارتك
          </button>
          <Link
            href="#services"
            className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all hover:-translate-y-1"
          >
            استكشف خدماتنا
            <ArrowRight size={20} className="rotate-180 rtl:rotate-0" />
          </Link>
        </motion.div>

      </div>

      <BookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  )
}