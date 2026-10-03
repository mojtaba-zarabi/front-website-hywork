// app/layout.tsx
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { UserProvider } from '@/contexts/UserContext'; // ✅ فقط ایمپورت
import { ToastProvider } from '@/components/NotificationToast';
import "leaflet/dist/leaflet.css";
import './globals.css';

// فونت اصلی سایت (فارسی)
const yekanBakh = localFont({
  src: './fonts/YekanBakh-Regular.ttf',
  weight: '400',
  style: 'normal',
  variable: '--font-yekan-bakh',
  display: 'swap',
});

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'MyApp',
    template: '%s | MyApp',
  },
  description: 'سکوی خرید و فروش محصولات',
  keywords: ['فروشگاه', 'خرید', 'فروش', 'محصولات', 'آنلاین'],
  authors: [{ name: 'MyApp Team' }],
  creator: 'MyApp',
  publisher: 'MyApp',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'MyApp',
    description: 'سکوی خرید و فروش محصولات',
    url: 'https://myapp.com',
    siteName: 'MyApp',
    locale: 'fa_IR',
    type: 'website',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // متغیرهای فونت روی html تعریف می‌شوند چون --font-sans در @theme روی :root ساخته می‌شود
    <html
      lang="fa"
      dir="rtl"
      data-scroll-behavior="smooth"
      className={`${yekanBakh.variable} ${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased min-h-screen flex flex-col">
        <ThemeProvider>
          <UserProvider>  {/* ✅ اینجا UserProvider را قرار دهید */}
            <ToastProvider>
              {children}
            </ToastProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}