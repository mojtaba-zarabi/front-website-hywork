// config/mobileApp.ts
// تنظیمات هدایت کاربران موبایل به اپلیکیشن
//
// تا وقتی scheme و لینک نصب پلتفرم خالی باشد، سایت موبایل مثل قبل کار می‌کند
// و هیچ هدایتی انجام نمی‌شود.

export const mobileApp = {
  // scheme اختصاصی اپ، بدون "://" (مثال: 'hywork' برای hywork://)
  scheme: '',

  // package name اپ اندروید (مثال: 'com.hywork.app')
  // اگر پر باشد، اندروید خودش در صورت نصب نبودن اپ به لینک نصب می‌رود (intent://)
  androidPackage: '',

  // صفحه نصب اپ اندروید (گوگل‌پلی، بازار، مایکت یا صفحه دانلود سایت، مثال: '/download')
  androidInstallUrl: '',

  // صفحه نصب اپ iOS (اپ‌استور یا صفحه دانلود سایت)
  iosInstallUrl: '',
};

// صفحه‌ای که تلاش می‌کند اپ را باز کند
export const OPEN_APP_PATH = '/open-app';

// مسیرهایی که روی موبایل هم در مرورگر باز می‌شوند
export const BROWSER_ONLY_PATHS = ['/admin', OPEN_APP_PATH];

export type MobilePlatform = 'android' | 'ios';

// فقط گوشی؛ تبلت‌ها و ربات‌های موتور جستجو سایت را می‌بینند
export function getMobilePlatform(userAgent: string): MobilePlatform | null {
  if (/bot|crawler|spider|slurp|lighthouse/i.test(userAgent)) return null;
  if (/Android.+Mobile/i.test(userAgent)) return 'android';
  if (/iPhone|iPod/i.test(userAgent)) return 'ios';
  return null;
}

export function getInstallUrl(platform: MobilePlatform): string {
  return platform === 'android' ? mobileApp.androidInstallUrl : mobileApp.iosInstallUrl;
}

export function isAppRedirectEnabled(platform: MobilePlatform): boolean {
  return Boolean(mobileApp.scheme && getInstallUrl(platform));
}

// صفحه نصب اگر روی همین سایت باشد نباید دوباره به اپ هدایت شود
export function isBrowserOnlyPath(pathname: string): boolean {
  const installPaths = [mobileApp.androidInstallUrl, mobileApp.iosInstallUrl].filter((url) =>
    url.startsWith('/')
  );
  return [...BROWSER_ONLY_PATHS, ...installPaths].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}
