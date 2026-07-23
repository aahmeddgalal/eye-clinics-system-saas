import LoadingScreen from '@/components/public/LoadingScreen'
import HeroSection from '@/components/public/HeroSection'
import AboutDoctor from '@/components/public/AboutDoctor'
import ServicesSection from '@/components/public/ServicesSection'
import EquipmentSection from '@/components/public/EquipmentSection'
import ReviewsCarousel from '@/components/public/ReviewsCarousel'

export const metadata = {
  title: 'دكتور صبري عياد | طبيب عيون',
  description: 'رعاية عيون متميزة تجمع بين الخبرة الجراحية العالمية وأحدث تكنولوجيا التشخيص.',
}

import { createClient } from '@/utils/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  
  // Fetch active announcement that is currently valid
  const now = new Date().toISOString()
  const { data: announcement } = await supabase
    .from('announcements')
    .select('title')
    .eq('is_active', true)
    .or(`start_date.is.null,start_date.lte.${now}`)
    .or(`end_date.is.null,end_date.gte.${now}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const activeAnnouncementText = announcement?.title || 'نستقبل مرضى جدد'

  return (
    <div className="bg-white selection:bg-[#1434A4] selection:text-white">
      <LoadingScreen />
      
      <HeroSection announcement={activeAnnouncementText} />
      <AboutDoctor />
      <ServicesSection />
      <ReviewsCarousel />
      <EquipmentSection />
    </div>
  )
}
