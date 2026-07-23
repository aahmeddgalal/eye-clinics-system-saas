'use client'

import { motion } from 'framer-motion'

export default function EquipmentSection() {
  const equipment = [
    {
      name: 'ليزر الفيمتو ثانية',
      desc: 'شقوق فائقة الدقة بدون شفرات لعمليات المياه البيضاء والليزك.',
      img: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=800&auto=format&fit=crop'
    },
    {
      name: 'التصوير المقطعي للترابط البصري (OCT)',
      desc: 'تصوير مقطعي عالي الدقة للشبكية والعصب البصري.',
      img: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?q=80&w=800&auto=format&fit=crop'
    },
    {
      name: 'طبوغرافيا القرنية',
      desc: 'تخطيط ثلاثي الأبعاد لسطح القرنية لتشخيص الاستجماتيزم والعدسات اللاصقة المخصصة.',
      img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=800&auto=format&fit=crop'
    }
  ]

  return (
    <section id="equipment" className="py-24 bg-[#1434A4] text-white overflow-hidden relative">
      
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 end-0 w-[800px] h-[800px] bg-[#1E4ED8] rounded-full blur-[120px] opacity-50 -translate-y-1/2 -translate-x-1/3 rtl:translate-x-1/3" />
      <div className="absolute bottom-0 start-0 w-[600px] h-[600px] bg-[#38BDF8] rounded-full blur-[150px] opacity-20 translate-y-1/3 translate-x-1/4 rtl:-translate-x-1/4" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-[#38BDF8] font-bold tracking-widest uppercase text-sm mb-3">التكنولوجيا التشخيصية</h2>
            <h3 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              الدقة مدفوعة بالابتكار.
            </h3>
            <p className="text-blue-100 font-light text-lg leading-relaxed max-w-lg">
              نحن نستثمر في أحدث تكنولوجيا طب العيون في العالم. تسمح التشخيصات الفائقة للدكتور صبري باكتشاف حالات العين قبل سنوات من تأثيرها على رؤيتك، بينما تضمن أنظمة الليزر الروبوتية دقة جراحية لا مثيل لها.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {equipment.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
              className="group rounded-3xl overflow-hidden bg-[#1E4ED8]/30 border border-white/10 backdrop-blur-md"
            >
              <div className="aspect-[4/3] overflow-hidden relative">
                {/* Fallback to dark abstract if image fails/loads slow */}
                <div className="absolute inset-0 bg-[#0f247a]" />
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 mix-blend-screen opacity-60"
                  style={{ backgroundImage: `url('${item.img}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1434A4] via-transparent to-transparent" />
              </div>
              <div className="p-8">
                <h4 className="text-xl font-bold mb-2">{item.name}</h4>
                <p className="text-blue-100 text-sm leading-relaxed opacity-80">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
