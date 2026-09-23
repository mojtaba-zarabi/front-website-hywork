// proxy.ts
// کاربران گوشی را به‌جای سایت موبایل به صفحه باز کردن اپ هدایت می‌کند

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  OPEN_APP_PATH,
  getMobilePlatform,
  isAppRedirectEnabled,
  isBrowserOnlyPath,
} from '@/config/mobileApp';

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (isBrowserOnlyPath(pathname)) return NextResponse.next();

  const platform = getMobilePlatform(request.headers.get('user-agent') || '');
  if (!platform || !isAppRedirectEnabled(platform)) return NextResponse.next();

  const url = new URL(OPEN_APP_PATH, request.url);
  url.searchParams.set('path', pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  // فایل‌های استاتیک و فایل‌های دارای پسوند (تصاویر، فونت‌ها و ...) مستثنی هستند
  matcher: ['/((?!_next/|.*\\.\\w+$).*)'],
};
