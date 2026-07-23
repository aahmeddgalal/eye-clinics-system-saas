import BackupClient from '@/components/backup/BackupClient'

export const metadata = {
  title: 'النسخ الاحتياطي | عيادة العيون',
}

export default function BackupPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">النسخ الاحتياطي والاستعادة</h1>
        <p className="text-slate-500 text-sm mt-1">
          قم بإنشاء نسخ احتياطية لبيانات العيادة للاحتفاظ بها، أو استعادة البيانات من نسخة سابقة.
        </p>
      </div>

      <BackupClient />
    </div>
  )
}
