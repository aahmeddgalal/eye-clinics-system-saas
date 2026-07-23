import DashboardShell from '@/components/DashboardShell'

export const metadata = {
  title: 'لوحة التحكم | دكتور صبري عياد',
  description: 'نظام إدارة العيادة',
}

export default function DashboardLayout({ children }) {
  return <DashboardShell>{children}</DashboardShell>
}
