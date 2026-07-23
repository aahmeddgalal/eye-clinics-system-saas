'use client'

import { motion } from 'framer-motion'
import { Eye, Droplet, ScanLine, Glasses, Sparkles, ActivitySquare } from 'lucide-react'

export default function ServicesSection() {
  const services = [
    {
      icon: Eye,
      title: 'جراحة المياه البيضاء',
      desc: 'إزالة المياه البيضاء بالليزر المتقدم مع زرع عدسات ممتازة داخل العين لرؤية فائقة الوضوح.'
    },
    {
      icon: Sparkles,
      title: 'الليزيك والفيمتوليزيك',
      desc: 'استمتع بحياة بدون نظارات أو عدسات لاصقة من خلال تصحيح الإبصار بالليزر المخصص وبدون شفرات.'
    },
    {
      icon: Droplet,
      title: 'عيادة جفاف العين',
      desc: 'تحليل شامل للدموع وعلاجات مستهدفة للحصول على راحة دائمة من جفاف العين.'
    },
    {
      icon: ActivitySquare,
      title: 'العناية بالشبكية',
      desc: 'تشخيص وعلاج خبير لاعتلال الشبكية السكري والضمور البقعي وتمزقات الشبكية.'
    },
    {
      icon: Glasses,
      title: 'فحوصات شاملة',
      desc: 'تقييم مفصل لصحة العين ووصفات دقيقة للنظارات والعدسات اللاصقة لجميع أفراد الأسرة.'
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  }

  return (
    <section id="services" className="py-24 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[#38BDF8] font-bold tracking-widest uppercase text-sm mb-3"
          >
            الخدمات
          </motion.h2>
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight"
          >
            خدمات رعاية عيون <span className="text-[#1434A4]">بمستوى عالمي</span>
          </motion.h3>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {services.map((service, idx) => {
            const Icon = service.icon
            return (
              <motion.div 
                key={idx}
                variants={itemVariants}
                className="group bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-2xl hover:border-[#38BDF8]/30 transition-all duration-300 relative overflow-hidden"
              >
                {/* Hover gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1434A4]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-[#1434A4]/5 group-hover:bg-[#1434A4] group-hover:text-white text-[#1434A4] flex items-center justify-center transition-colors duration-300 mb-6">
                    <Icon size={28} strokeWidth={1.5} />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-3">{service.title}</h4>
                  <p className="text-slate-600 font-light leading-relaxed">
                    {service.desc}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

      </div>
    </section>
  )
}
