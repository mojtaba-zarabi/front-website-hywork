'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  // فقط زیر lg (موبایل و تبلت) استفاده می‌شود؛ در دسکتاپ سایدبار همیشه باز است
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // بعد از رفتن به صفحه دیگر، کشوی سایدبار بسته شود
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // صفحه ورود نباید منوی پنل را نشان دهد
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <div className="flex flex-1 relative">
        <AdminSidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <div className="flex-1 min-w-0 overflow-y-auto px-4 pt-16 pb-6 sm:px-6 lg:pt-6 lg:px-8 lg:ms-65 bg-bg-primary min-h-[calc(100vh-70px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
