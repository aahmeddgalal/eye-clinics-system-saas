'use client'

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

export default function ReviewsCarousel() {
  const reviews = [
    {
      name: "سارة محمد",
      procedure: "مريضة ليزك",
      text: "لقد غير د. صبري حياتي. ارتديت النظارات منذ أن كنت في السابعة من عمري، والاستيقاظ في اليوم التالي للجراحة برؤية 6/6 مثالية كان بمثابة معجزة. كانت تجربة العيادة بأكملها فاخرة ومريحة."
    },
    {
      name: "أحمد محمود",
      procedure: "جراحة المياه البيضاء",
      text: "مستوى التكنولوجيا هنا لا يصدق. شرح د. صبري إجراء المياه البيضاء بالليزر بوضوح شديد، والنتائج مع عدساتي الممتازة الجديدة مذهلة. يمكنني القراءة مرة أخرى بدون نظارات قراءة!"
    },
    {
      name: "ليلى حسن",
      procedure: "علاج المياه الزرقاء",
      text: "كان تشخيصي بالمياه الزرقاء مرعباً، لكن فريق العيادة منحني راحة بال هائلة. تكتشف فحوصاتهم المتقدمة الأشياء مبكراً، وتم التحكم في ضغط عيني بشكل مثالي لمدة عامين."
    },
    {
      name: "محمود علي",
      procedure: "علاج جفاف العين",
      text: "بعد سنوات من المعاناة من جفاف العين الشديد وتجربة كل قطرة في السوق، منحني العلاج هنا أخيراً راحة مستدامة. أوصي بشدة بالدكتور صبري."
    },
    {
      name: "ياسر كمال",
      procedure: "عملية الفيمتو سمايل",
      text: "تقنية الفيمتو سمايل كانت سريعة جداً وبدون ألم نهائياً. الرعاية بعد العملية كانت ممتازة والمتابعة دقيقة جداً. شكراً لكل الفريق الطبي."
    },
    {
      name: "فاطمة عبدالرحمن",
      procedure: "علاج اعتلال الشبكية",
      text: "كنت قلقة جداً على نظري بسبب مرض السكري، لكن متابعة د. صبري الدقيقة وعلاجه بالليزر أنقذ بصري واستقر الوضع تماماً."
    },
    {
      name: "طارق سعيد",
      procedure: "علاج القرنية المخروطية",
      text: "عملية تثبيت القرنية أوقفت تدهور نظري تماماً. أجهزة العيادة حديثة جداً والتشخيص كان في منتهى الدقة والاحترافية."
    },
    {
      name: "منى عبدالسلام",
      procedure: "فحص شامل للعين",
      text: "أفضل عيادة عيون زرتها. الأجهزة متطورة، طاقم العمل ودود جداً، والاهتمام بالتعقيم والنظافة ملحوظ من أول لحظة تدخل فيها العيادة."
    },
    {
      name: "كريم مصطفى",
      procedure: "زراعة عدسات ICL",
      text: "زراعة العدسات كانت الحل الأمثل لي بعد رفض الليزك بسبب سمك القرنية. النتيجة خرافية والرؤية الليلية أصبحت ممتازة."
    },
    {
      name: "هند جلال",
      procedure: "تجميل الجفون",
      text: "النتيجة طبيعية جداً وأعطتني ثقة كبيرة بنفسي. الدكتور استمع لكل مخاوفي بصدر رحب والعملية مرت بسلام تام وبدون مضاعفات."
    }
  ]

  const duplicatedReviews = [...reviews, ...reviews]

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-[#38BDF8] font-bold tracking-widest uppercase text-sm mb-3">قصص المرضى</h2>
          <h3 className="text-4xl md:text-5xl font-bold text-slate-900">
            استمع إلى <span className="text-[#1434A4]">مرضانا</span>
          </h3>
          <p className="text-slate-500 mt-4 max-w-xl">
            اكتشف شهادات المرضى الذين وثقوا بنا في أغلى حواسهم.
          </p>
        </motion.div>
      </div>

      <div className="overflow-hidden max-w-full flex">
        <motion.div
          className="flex gap-6 w-max pe-6"
          
          animate={{ x: ["0%", "50%"] }}
          transition={{
            duration: 100, 
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {duplicatedReviews.map((review, idx) => (
            <div
              key={idx}
              className="w-[260px] md:w-[320px] flex-shrink-0 bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between"
            >
              <div>
                <Quote size={32} className="text-[#38BDF8]/20 mb-4" />
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} size={14} className="fill-[#1434A4] text-[#1434A4]" />
                  ))}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed italic mb-6">
                  "{review.text}"
                </p>
              </div>
              <div className="border-t border-slate-200 pt-4 mt-auto">
                <p className="font-bold text-sm text-slate-900">{review.name}</p>
                <p className="text-xs text-[#1434A4] font-medium mt-1">{review.procedure}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}