'use client';

import { useState } from 'react';
import { login } from './actions';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // دالة لتعبئة البيانات تلقائياً
  const fillCredentials = () => {
    setEmail('galileo@dev.com');
    setPassword('galileo123');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
      {/* Container */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">

        {/* Header / Brand */}
        <div className="bg-blue-600 px-8 py-10 text-center">
          <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">بوابة الإدارة</h1>
          <p className="text-blue-100 mt-2 text-sm">بوابة الإدارة الآمنة</p>
        </div>

        {/* Form */}
        <div className="p-8">
          {/* كارت لتعبئة بيانات التجربة بضغطة واحدة */}
          <div className="mb-6 p-3 bg-slate-100 rounded-lg border border-slate-200 text-xs text-slate-600 flex justify-between items-center">
            <div>
              <p className="font-semibold text-slate-700">بيانات التجربة:</p>
              <p dir="ltr" className="text-start text-slate-500">galileo@dev.com | galileo123</p>
            </div>
            <button
              type="button"
              onClick={fillCredentials}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium px-2.5 py-1.5 rounded transition-colors text-xs"
            >
              تجربة سريعة
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">البريد الإلكتروني</label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@clinic.com"
                dir="ltr"
                className="w-full px-4 py-3 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none transition-colors bg-white text-[#111827] placeholder-[#9CA3AF] text-end"
                suppressHydrationWarning
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">كلمة المرور</label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                dir="ltr"
                className="w-full px-4 py-3 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none transition-colors bg-white text-[#111827] placeholder-[#9CA3AF] text-end"
                suppressHydrationWarning
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex justify-center items-center shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
              suppressHydrationWarning
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                "تسجيل الدخول إلى لوحة التحكم"
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            <p>للموظفين المصرح لهم فقط. للدعم، اتصل بقسم تكنولوجيا المعلومات.</p>
          </div>
        </div>

      </div>
    </div>
  );
}