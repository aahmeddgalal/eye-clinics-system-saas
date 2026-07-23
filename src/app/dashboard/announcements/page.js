import { createClient } from '@/utils/supabase/server'
import AnnouncementsClient from '@/components/announcements/AnnouncementsClient'

export const metadata = {
  title: 'Announcements | Eye Clinic',
}

export default async function AnnouncementsPage() {
  const supabase = await createClient()

  // Fetch announcements
  const { data: announcements, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching announcements:', error)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <AnnouncementsClient initialAnnouncements={announcements || []} />
    </div>
  )
}
