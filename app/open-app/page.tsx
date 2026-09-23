// src/app/open-app/page.tsx
'use client';

import { useEffect } from 'react';
import { mobileApp, getMobilePlatform, getInstallUrl } from '@/config/mobileApp';

// اگر بعد از این مدت صفحه هنوز دیده می‌شود یعنی اپ باز نشده است
const APP_OPEN_TIMEOUT_MS = 2000;

export default function OpenAppPage() {
  useEffect(() => {
    const platform = getMobilePlatform(navigator.userAgent);
    if (!platform || !mobileApp.scheme) {
      window.location.replace('/');
      return;
    }

    const installUrl = getInstallUrl(platform);
    const requested = new URLSearchParams(window.location.search).get('path') || '/';
    // فقط مسیر داخلی سایت پذیرفته می‌شود
    const appPath = requested.startsWith('/') && !requested.startsWith('//') ? requested.slice(1) : '';

    // اندروید با package name: خود سیستم در صورت نصب نبودن اپ به لینک نصب می‌رود
    if (platform === 'android' && mobileApp.androidPackage) {
      const fallback = new URL(installUrl, window.location.origin).href;
      window.location.replace(
        `intent://${appPath}#Intent;scheme=${mobileApp.scheme};package=${mobileApp.androidPackage};` +
          `S.browser_fallback_url=${encodeURIComponent(fallback)};end`
      );
      return;
    }

    // iOS (یا اندروید بدون package name): اگر اپ باز شد صفحه پنهان می‌شود
    const timer = window.setTimeout(() => {
      if (!document.hidden) window.location.replace(installUrl);
    }, APP_OPEN_TIMEOUT_MS);
    const handleVisibilityChange = () => {
      if (document.hidden) window.clearTimeout(timer);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.location.href = `${mobileApp.scheme}://${appPath}`;

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="text-text-muted text-center">
        <div className="w-10 h-10 border-4 border-border-color border-t-accent-color rounded-full animate-spin mx-auto" />
        <p className="mt-4">در حال باز کردن اپلیکیشن...</p>
      </div>
    </div>
  );
}
