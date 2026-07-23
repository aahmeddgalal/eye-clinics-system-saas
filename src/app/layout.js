import { Cairo } from "next/font/google";
import "./globals.css";
import PublicHeader from '@/components/public/PublicHeader'
import ContactFooter from '@/components/public/ContactFooter'
import { createClient } from '@/utils/supabase/server'
import { Toaster } from 'react-hot-toast'

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cairo",
});

export const metadata = {
  title: "دكتور صبري عياد | عيادة العيون",
  description: "نظام إدارة العيادات الشامل لعيادة طب وجراحة العيون.",
  openGraph: {
    images: ['/og.png'],
  },
};

export default async function RootLayout({ children }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const isAdmin = !!session;

  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} h-full antialiased font-cairo light`}
      style={{ colorScheme: 'light' }}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" type="image/png" href="/favicon/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon/favicon.svg" />
        <link rel="shortcut icon" href="/favicon/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="DrSabry" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900" suppressHydrationWarning>
        <PublicHeader isAdmin={isAdmin} />
        <main className="flex-1 w-full relative z-10">
          {children}
        </main>
        <ContactFooter />
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
