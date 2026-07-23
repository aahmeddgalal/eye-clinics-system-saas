import { Settings, Save, Shield, Bell, User } from 'lucide-react'

export const metadata = {
  title: 'Settings | Eye Clinic',
}

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage system preferences and core clinic settings.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100">
          <button className="px-6 py-4 text-sm font-bold text-[#1434A4] border-b-2 border-[#1434A4] bg-blue-50/50">
            General
          </button>
          <button className="px-6 py-4 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
            Security
          </button>
          <button className="px-6 py-4 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
            Notifications
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          
          {/* Section 1 */}
          <section>
            <div className="flex items-center gap-2 mb-4 text-slate-900">
              <User size={20} className="text-[#1434A4]" />
              <h2 className="text-lg font-bold">Clinic Information</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Clinic Name</label>
                <input 
                  type="text" 
                  defaultValue="عيادة د. صبري عياد للعيون"
                  className="w-full px-4 py-2.5 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none transition-all text-sm bg-white text-[#111827]"
                  suppressHydrationWarning
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Contact Phone Number</label>
                <input 
                  type="text" 
                  defaultValue="01012345678"
                  className="w-full px-4 py-2.5 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none transition-all text-sm bg-white text-[#111827]"
                  suppressHydrationWarning
                />
              </div>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Section 2 */}
          <section>
            <div className="flex items-center gap-2 mb-4 text-slate-900">
              <Shield size={20} className="text-[#1434A4]" />
              <h2 className="text-lg font-bold">System Preferences</h2>
            </div>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Theme (Background)</h4>
                  <p className="text-xs text-slate-500 mt-1">Currently active: Light Mode.</p>
                </div>
                <div className="relative inline-block w-12 h-6 rounded-full bg-slate-200">
                  <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform transform translate-x-0"></span>
                </div>
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Appointment Alerts</h4>
                  <p className="text-xs text-slate-500 mt-1">Send notifications when a new patient joins the list.</p>
                </div>
                <div className="relative inline-block w-12 h-6 rounded-full bg-[#1434A4]">
                  <span className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white transition-transform transform"></span>
                </div>
              </label>
            </div>
          </section>

          <div className="pt-4 flex justify-end">
            <button className="px-6 py-2.5 bg-[#1434A4] hover:bg-[#102a83] text-white text-sm font-medium rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 hover:scale-[1.02]">
              <Save size={18} />
              Save Changes
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
