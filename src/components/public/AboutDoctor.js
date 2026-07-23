'use client'

import { motion } from 'framer-motion'
import { Award, GraduationCap, Microscope, Clock } from 'lucide-react'

export default function AboutDoctor() {
  const features = [
    { icon: GraduationCap, title: 'طبيب معتمد', desc: 'رئيس مجلس ادارة مستشفى مودة للعيون' },
    { icon: Microscope, title: 'جراح متخصص', desc: 'خبرة في الجراحات الدقيقة والفمتوليزيك' },
    { icon: Award, title: 'خبرة أكثر من 25 عاماً', desc: 'آلاف العمليات الجراحية الناجحة' },
  ]

  return (
    <section id="about" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left: Image/Graphic */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-[#1434A4] rounded-[3rem] rotate-3 opacity-10 blur-lg" />
          <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden bg-slate-100 shadow-2xl border border-slate-200/50">
            {/* Minimalist Medical Abstract instead of a specific face if no photo provided */}
            <div 
              className="absolute inset-0 bg-cover bg-center mix-blend-multiply opacity-90 transition-transform duration-700 hover:scale-105"
              style={{ backgroundImage: 'url(/doctor.jpg)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1434A4] via-[#1434A4]/40 to-transparent opacity-80" />
            <div className="absolute bottom-8 start-8 end-8 text-white">
              <h3 className="text-3xl font-bold drop-shadow-md">دكتور صبري عياد</h3>
              <p className="text-blue-200 font-medium tracking-wide mt-1">استشاري طب وجراحة العيون</p>
            </div>
          </div>
        </motion.div>

        {/* Right: Content */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-[#38BDF8] font-bold tracking-widest uppercase text-sm mb-3">عن الطبيب</h2>
          <h3 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
            ريادة مستقبل <span className="text-[#1434A4]">العناية السريرية بالعيون.</span>
          </h3>
          
          <div className="space-y-6 text-slate-600 text-lg leading-relaxed mb-10">
            <p>
              دكتور صبري عياد هو استشاري وجراح عيون مصري، وُلد عام 1963. تخرج من كلية الطب بجامعة المنوفية عام 1988 حاصلاً على بكالوريوس الطب والجراحة، وتخصص في طب العيون حيث أصبح أخصائياً عام 1994، ونال درجة استشاري منذ عام 2014.
            </p>
            <p>
              في عيادتنا، تدمج فلسفتنا بين الخبرة الطبية والرعاية الطبية بالمرضى. <strong className="font-bold text-slate-900">نحن نؤمن بأن حماية رؤيتك ليست مجرد إجراء طبي، بل هي حفاظ على جودة حياتك.</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            {features.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="flex items-start gap-4 group"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-[#1434A4] shrink-0 group-hover:bg-[#1434A4] group-hover:text-white transition-colors duration-300 shadow-sm">
                    <Icon size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{feature.title}</h4>
                    <p className="text-sm text-slate-500 mt-1 leading-snug">{feature.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>


          {/* <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-slate-50 border border-[#D1D5DB] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
          >
            <div className="absolute top-0 start-0 w-1 h-full bg-[#1434A4]" />
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#1434A4]/10 flex items-center justify-center text-[#1434A4]">
                <Clock size={20} />
              </div>
              <h4 className="font-bold text-lg text-slate-900">مواعيد العيادة</h4>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div>
                <p className="text-sm text-slate-500 mb-1">أيام العمل</p>
                <p className="font-bold text-slate-800">السبت، الاتنين، التلات، الاربع</p>
              </div>
              <div className="h-px sm:h-8 w-full sm:w-px bg-slate-200" />
              <div>
                <p className="text-sm text-slate-500 mb-1">الوقت</p>
                <p className="font-bold text-[#1434A4]">من 6 مساءً إلى 11 مساءً</p>
              </div>
            </div>
          </motion.div> */}

        </motion.div>

      </div>
    </section>
  )
}
